"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MirrorQuestion, EvaReaction, getEvaReaction, getDailyQuestions } from "@/lib/mirror/questions";
import { feedSeed, loadSeed, saveSeed } from "@/lib/mirror/seed";
import { track } from "@/lib/mirror/analytics";
import { checkTraitUnlock, Trait } from "@/lib/mirror/traits-v2";
import { getPlayfulReaction } from "@/lib/mirror/input-validation";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { saveSessionHistory, updateUserHumanScore, createOrUpdateUser, updateUserPoints } from "@/lib/supabase/services";
import { getTwitterAuth } from "@/lib/mirror/auth";
import ChipInput from "./chip-input";
import PrimaryButton from "../primary-button";
import { Sparkles, Brain, Heart, Zap } from "lucide-react";

type TransmissionStage = "intro" | "question" | "thinking" | "reaction" | "complete";

const moodIcons = {
  curious: Brain,
  contemplative: Brain,
  delighted: Heart,
  playful: Sparkles,
  shocked: Zap,
};

// Calculate human score based on answer quality
function calculateHumanScore(sessionData: Array<{ answer: string; reaction: EvaReaction | null; question: MirrorQuestion }>): { 
  score: number; 
  breakdown: {
    chipOnlyAnswers: number;
    thoughtfulAnswers: number;
    averageLength: number;
    detailLevel: 'minimal' | 'basic' | 'detailed' | 'comprehensive';
    feedback: string[];
  }
} {
  if (sessionData.length === 0) return { 
    score: 0, 
    breakdown: { 
      chipOnlyAnswers: 0, 
      thoughtfulAnswers: 0, 
      averageLength: 0, 
      detailLevel: 'minimal', 
      feedback: [] 
    } 
  };
  
  let totalScore = 0;
  let chipOnlyAnswers = 0;
  let thoughtfulAnswers = 0;
  let totalLength = 0;
  const feedback: string[] = [];
  
  sessionData.forEach(({ answer, reaction, question }) => {
    let score = 30; // Reduced base score
    const charCount = answer.trim().length;
    const wordCount = answer.trim().split(/\s+/).length;
    totalLength += charCount;
    
    // Check if answer is chip-only (very short, likely just selected suggestions)
    const isChipOnly = charCount < 20 || wordCount < 4;
    
    if (isChipOnly) {
      chipOnlyAnswers++;
      score = Math.min(score, 40); // Cap chip-only answers at 40
    } else {
      thoughtfulAnswers++;
      
      // Length score (up to 25 points for thoughtful answers)
      if (charCount >= 120) score += 25;
      else if (charCount >= 80) score += 20;
      else if (charCount >= 50) score += 15;
      else if (charCount >= 30) score += 10;
      else score += 5;
      
      // Detail score (up to 20 points) - check for punctuation, multiple sentences
      const hasPunctuation = /[.!?,;:]/.test(answer);
      const hasMultipleSentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 3).length > 1;
      const hasSpecificDetails = /\b(because|when|where|how|why|specifically|example|like|such as)\b/i.test(answer);
      
      if (hasMultipleSentences && hasSpecificDetails) score += 20;
      else if (hasMultipleSentences) score += 15;
      else if (hasPunctuation && hasSpecificDetails) score += 12;
      else if (hasPunctuation) score += 8;
      else score += 3;
      
      // Personal touch score (up to 15 points) - first person references, emotions
      const hasPersonalPronouns = /\b(I|me|my|myself|personally)\b/i.test(answer);
      const hasEmotions = /\b(feel|think|believe|love|hate|fear|hope|excited|nervous|happy|sad|angry)\b/i.test(answer);
      
      if (hasPersonalPronouns && hasEmotions) score += 15;
      else if (hasPersonalPronouns) score += 10;
      else if (hasEmotions) score += 8;
      else score += 3;
    }
    
    // Engagement score (up to 10 points) - based on Eva's reaction
    if (reaction) {
      if (reaction.mood === "shocked" || reaction.mood === "curious") score += 10;
      else if (reaction.mood === "contemplative") score += 8;
      else if (reaction.mood === "playful") score += 6;
      else score += 3;
    }
    
    totalScore += Math.min(score, 100); // Cap at 100 per answer
  });
  
  const averageScore = Math.round(totalScore / sessionData.length);
  const averageLength = Math.round(totalLength / sessionData.length);
  
  // Generate feedback based on performance
  if (chipOnlyAnswers > sessionData.length * 0.7) {
    feedback.push("Most responses were very brief - try sharing more personal details next time");
  }
  if (chipOnlyAnswers > 0 && thoughtfulAnswers > 0) {
    feedback.push(`${chipOnlyAnswers} quick responses and ${thoughtfulAnswers} detailed responses detected`);
  }
  if (averageLength < 30) {
    feedback.push("Try writing 1-2 sentences with specific examples");
  } else if (averageLength < 60) {
    feedback.push("Good start! Consider adding more personal context");
  } else if (averageLength >= 100) {
    feedback.push("Excellent response depth - great self-reflection!");
  }
  
  // Determine detail level
  let detailLevel: 'minimal' | 'basic' | 'detailed' | 'comprehensive';
  if (averageScore >= 85) detailLevel = 'comprehensive';
  else if (averageScore >= 70) detailLevel = 'detailed';
  else if (averageScore >= 50) detailLevel = 'basic';
  else detailLevel = 'minimal';
  
  return {
    score: averageScore,
    breakdown: {
      chipOnlyAnswers,
      thoughtfulAnswers,
      averageLength,
      detailLevel,
      feedback
    }
  };
}

interface EvaTransmissionProps {
  onComplete?: () => void;
}

export default function EvaTransmission({ onComplete }: EvaTransmissionProps = {}) {
  const [stage, setStage] = useState<TransmissionStage>("intro");
  const [questions, setQuestions] = useState<MirrorQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [evaReaction, setEvaReaction] = useState<EvaReaction | null>(null);
  const [sessionData, setSessionData] = useState<Array<{
    question: MirrorQuestion;
    answer: string;
    reaction: EvaReaction | null;
  }>>([]);
  const [unlockedTrait, setUnlockedTrait] = useState<Trait | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(10);
  
  // Load user's vibe from Soul Seed
  const soulSeed = loadSeed();
  const userVibe = soulSeed.vibe || "ethereal";
  const userAlias = soulSeed.alias || "Seeker";

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;

  useEffect(() => {
    // Load daily questions
    const dailyQuestions = getDailyQuestions(5);
    setQuestions(dailyQuestions);
  }, []);



  useEffect(() => {
    // Auto-redirect to profile after completion
    if (stage === "complete") {
      let countdown = 10;
      setRedirectCountdown(countdown);
      
      const interval = setInterval(() => {
        countdown--;
        setRedirectCountdown(countdown);
        
        if (countdown <= 0) {
          window.location.href = '/profile';
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [stage]);

  async function handleSubmitAnswer() {
    if (!userInput.trim() || !currentQuestion) return;

    // Show thinking stage while we analyze
    setStage("thinking");

    try {
      // Call OpenAI API for analysis
      const response = await fetch("/api/analyze-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput,
          question: currentQuestion.text,
          category: currentQuestion.category,
          vibe: userVibe,
          alias: userAlias,
          isOnboarding: false
        }),
      });

      const analysis = await response.json() as import("@/app/api/analyze-response/route").AnalysisResponse;

      // Check if we should terminate session
      if (analysis.shouldTerminate) {
        // Load seed and update offensive count
        const seed = loadSeed();
        seed.offensiveCount = (seed.offensiveCount || 0) + 1;
        await saveSeed(seed);

        // Set termination reaction
        const terminationReaction: EvaReaction = {
          triggers: [],
          response: userVibe === "ethereal" 
            ? "Your frequencies are... corrupted. Perhaps meditate on your intentions and return when you're ready to engage authentically. *transmission terminated*"
            : userVibe === "zen"
            ? "The darkness you carry disrupts the flow. Find your center and return with pure intentions. *session ended*"
            : "[CRITICAL ERROR: Toxic pattern overflow] System protection engaged. Resetting connection. *logout initiated*",
          rarity: "rare",
          mood: "shocked",
        };
        setEvaReaction(terminationReaction);
        setStage("reaction");
        
        // Force restart after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        return;
      }

      // Create Eva's reaction from OpenAI response
      const dynamicReaction: EvaReaction = {
        triggers: [],
        response: analysis.evaResponse,
        rarity: analysis.category === "offensive" ? "rare" : "common",
        mood: analysis.category === "offensive" ? "shocked" : 
              analysis.category === "test" ? "curious" :
              analysis.quality > 7 ? "delighted" : "contemplative",
      };

      setEvaReaction(dynamicReaction);

      // Track answer with analysis
      track("prompt_answered", {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        answerLength: userInput.length,
        quality: analysis.quality,
        responseCategory: analysis.category,
      });

          // Only save and progress if response was acceptable
      if (analysis.category !== "offensive" && analysis.category !== "spam") {
        // Check for trait unlock
        const seed = loadSeed();
        if (seed) {
          // Update trust penalty
          seed.trustPenalty = (seed.trustPenalty || 0) + analysis.trustImpact;
          
          // Store analysis
          const memoryId = `${currentQuestion.id}_${Date.now()}`;
          seed.analyzedResponses = {
            ...seed.analyzedResponses,
            [memoryId]: {
              quality: analysis.quality,
              category: analysis.category,
              sincerity: analysis.sincerity,
              flags: analysis.flags,
              trustImpact: analysis.trustImpact
            }
          };

          const allAnswers = [
            ...sessionData.map(d => ({
              questionId: d.question.id,
              category: d.question.category,
              text: d.answer,
              depth: d.question.difficulty
            })),
            {
              questionId: currentQuestion.id,
              category: currentQuestion.category,
              text: userInput,
              depth: currentQuestion.difficulty
            }
          ];

          const newTraits = checkTraitUnlock(
            {
              questionId: currentQuestion.id,
              category: currentQuestion.category,
              text: userInput,
              depth: currentQuestion.difficulty
            },
            allAnswers.slice(0, -1), // Don't include current answer twice
            seed.earnedTraits || []
          );

          if (newTraits.length > 0) {
            // Save the first unlocked trait
            const trait = newTraits[0];
            setUnlockedTrait(trait);
            
            // Update soul seed with new trait
            const newEarnedTrait = {
              traitId: trait.id,
              earnedAt: Date.now(),
              triggerAnswer: userInput,
              questionId: currentQuestion.id,
              strength: 50 // Start at 50 strength
            };
            
            seed.earnedTraits = [...(seed.earnedTraits || []), newEarnedTrait];
            
            track("trait_unlocked", {
              traitId: trait.id,
              category: trait.category,
              rarity: trait.rarity
            });
          }

          await saveSeed(seed);
        }

        // Save to session
        setSessionData([...sessionData, {
          question: currentQuestion,
          answer: userInput,
          reaction: dynamicReaction,
        }]);
      }

      // Clear input and show reaction
      setUserInput("");
      setStage("reaction");

    } catch (error) {
      console.error("Error analyzing response:", error);
      
      // Fallback to generic Eva reaction
      const reaction = getEvaReaction(userInput, currentQuestion.category, userVibe, userAlias);
      setEvaReaction(reaction || {
        triggers: [],
        response: "My circuits are experiencing interference. Let's try that again.",
        rarity: "common",
        mood: "contemplative",
      });
      setStage("reaction");
      return;
    }
  }

  function handleContinue() {
    if (isLastQuestion) {
      // Complete session
      completeSession();
    } else {
      // Next question
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setEvaReaction(null);
      setUnlockedTrait(null);
      setStage("question");
    }
  }

  async function completeSession() {
    // Feed the soul seed with all answers
    let seed = loadSeed();
    if (seed) {
      sessionData.forEach(({ question, answer }) => {
        const result = feedSeed(seed, question.id, answer);
        seed = result.seed;
      });
    }

    // Calculate and save human score to profile
    const { score: humanScore, breakdown } = calculateHumanScore(sessionData);
    const questionsAnswered = sessionData.length;
    const pointsEarned = questionsAnswered * 500;
    
    // Load and update profile
    const profile = loadProfile();
    
    // Add to session history with duplicate prevention
    if (!profile.sessionHistory) {
      profile.sessionHistory = [];
    }
    
    // Check for duplicate session within the last 5 minutes
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const isDuplicate = profile.sessionHistory.some(session => 
      session.date > fiveMinutesAgo && 
      session.questionsAnswered === questionsAnswered
    );
    
    if (!isDuplicate) {
      // Update average human score
      if (profile.humanScore && profile.totalQuestionsAnswered) {
        // Calculate new average
        const totalScore = profile.humanScore * profile.totalQuestionsAnswered + humanScore * questionsAnswered;
        const totalQuestions = profile.totalQuestionsAnswered + questionsAnswered;
        profile.humanScore = Math.round(totalScore / totalQuestions);
        profile.totalQuestionsAnswered = totalQuestions;
      } else {
        // First session
        profile.humanScore = humanScore;
        profile.totalQuestionsAnswered = questionsAnswered;
      }
      
      // Don't add session points to profile.points - they're tracked in sessionHistory
      // profile.points should only contain base points + OG bonus
      
      // Add session to history with actual question data
      profile.sessionHistory.push({
        date: now,
        questionsAnswered,
        humanScore,
        pointsEarned,
        sessionData: sessionData.map(item => ({
          questionId: item.question.id,
          questionText: item.question.text,
          answer: item.answer,
          // We can add quality/sincerity scores later if needed
        }))
      });
      console.log('[EvaTransmission] Session saved to history');
    } else {
      console.log('[EvaTransmission] Duplicate session detected, skipping save');
      // Don't update points or scores for duplicate sessions
    }
    
    // Save updated profile
    saveProfile(profile);

    // Save to Supabase if authenticated
    try {
      const auth = getTwitterAuth();
      if (auth?.twitterHandle) {
        const { user } = await createOrUpdateUser(auth.twitterHandle, auth.twitterName, auth.isOG);
        if (user) {
          // Save session history
          await saveSessionHistory(user.id, questionsAnswered, humanScore, pointsEarned);
          
          // Update human score
          await updateUserHumanScore(user.id, humanScore, questionsAnswered);
          
          // Sync complete profile instead of just updating points
          const { syncCompleteProfile } = await import('@/lib/supabase/sync-profile');
          await syncCompleteProfile();
          console.log('[EvaTransmission] Profile synced to Supabase');
        }
      }
    } catch (error) {
      console.error('Error saving session to Supabase:', error);
    }

    track("daily_completed", {
      questionsAnswered: sessionData.length,
      humanScore,
      pointsEarned,
    });

    setStage("complete");
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    }
  }

  function skipQuestion() {
    track("prompt_skipped", {
      questionId: currentQuestion?.id,
    });
    handleContinue();
  }

  const progressPercentage = questions.length > 0 
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      {stage !== "intro" && stage !== "complete" && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {currentQuestion?.category}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Intro Stage */}
        {stage === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 px-4"
          >
            <div className="relative w-32 h-32 mx-auto mb-8">
              <img 
                src="/images/eva%20assets/eva-pfp.png" 
                alt="Eva"
                className="w-full h-full rounded-full object-cover"
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(168, 85, 247, 0.4)",
                    "0 0 40px rgba(236, 72, 153, 0.4)",
                    "0 0 20px rgba(168, 85, 247, 0.4)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            <h2 className="text-2xl font-bold text-purple-700">
              {userVibe === "ethereal" && `Greetings, ${userAlias}`}
              {userVibe === "zen" && `Welcome, ${userAlias}`}
              {userVibe === "cyber" && `Connection established, ${userAlias}`}
            </h2>
            
            <p className="text-base text-gray-700 max-w-md mx-auto leading-relaxed">
              {userVibe === "ethereal" && "I'm Eva, studying your species through careful observation. Your answers help me understand what it means to be... human."}
              {userVibe === "zen" && "I am Eva, observing the flow of consciousness. Your reflections illuminate the path of understanding."}
              {userVibe === "cyber" && "EVA v2.0 online. Analyzing human behavioral patterns. Your data contributes to my understanding protocols."}
            </p>
            
            {/* Show playful reaction to alias if applicable */}
            {(() => {
              const reaction = getPlayfulReaction(userAlias);
              if (reaction) {
                return (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-pink-700 italic"
                  >
                    {reaction}
                  </motion.p>
                );
              }
              return null;
            })()}

            <p className="text-base text-gray-600">
              {userVibe === "ethereal" && `Today's transmission contains ${questions.length} questions. Shall we begin?`}
              {userVibe === "zen" && `${questions.length} contemplations await. Ready to explore?`}
              {userVibe === "cyber" && `[QUERY COUNT: ${questions.length}] Initialize session?`}
            </p>

            <button 
              onClick={() => setStage("question")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-3 px-8 font-medium text-base hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              I'm ready
            </button>
          </motion.div>
        )}

        {/* Question Stage */}
        {stage === "question" && currentQuestion && (
          <motion.div
            key={`question-${currentIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6 px-4"
          >
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <img 
                  src="/images/eva%20assets/eva-pfp.png" 
                  alt="Eva"
                  className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                />
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-gray-600 italic">
                    {currentQuestion.evaPrompt}
                  </p>
                  <h3 className="text-xl font-medium text-black">
                    {currentQuestion.text}
                  </h3>
                </div>
              </div>

              <ChipInput
                value={userInput}
                onChange={setUserInput}
                placeholder="Type your answer..."
                chips={currentQuestion.chipSuggestions}
              />

              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={skipQuestion}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip this question
                </button>
                
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={!userInput.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-2 px-6 font-medium text-base hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Thinking Stage */}
        {stage === "thinking" && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              <img 
                src="/images/eva%20assets/eva-pfp.png" 
                alt="Eva thinking"
                className="w-full h-full rounded-full"
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-pink-400/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <p className="text-gray-600 italic">
              {userVibe === "ethereal" && "*circuits humming softly*"}
              {userVibe === "zen" && "*contemplating in silence*"}
              {userVibe === "cyber" && "[PROCESSING: 47%... 89%... 100%]"}
            </p>
          </motion.div>
        )}

        {/* Reaction Stage */}
        {stage === "reaction" && evaReaction && (
          <motion.div
            key="reaction"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <img 
                  src="/images/eva%20assets/eva-pfp.png" 
                  alt="Eva"
                  className="w-12 h-12 rounded-full"
                />
                {React.createElement(moodIcons[evaReaction.mood], {
                  className: "w-5 h-5 absolute -bottom-1 -right-1 bg-white rounded-full p-1 text-pink-600",
                })}
              </div>
              
              <div className="flex-1 space-y-4">
                <p className="text-lg">
                  {evaReaction.response}
                </p>

                {(unlockedTrait || evaReaction.unlock) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    {unlockedTrait && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-200 to-pink-300 text-gray-800 border border-pink-400">
                        <span className="text-lg">{unlockedTrait.icon}</span>
                        <div>
                          <div className="font-medium">{unlockedTrait.name}</div>
                          <div className="text-xs opacity-80">{unlockedTrait.description}</div>
                        </div>
                        <span className="text-xs bg-pink-200 px-2 py-1 rounded-full">
                          {unlockedTrait.hashtag}
                        </span>
                      </div>
                    )}
                    {evaReaction.unlock && !unlockedTrait && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-200 text-gray-800 text-sm">
                        <Sparkles className="w-4 h-4" />
                        Trait unlocked: {evaReaction.unlock}
                      </div>
                    )}
                  </motion.div>
                )}

                {evaReaction.followUp && (
                  <p className="text-sm text-gray-600 italic">
                    {evaReaction.followUp}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-4">
              <PrimaryButton onClick={handleContinue}>
                Continue
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {/* Complete Stage */}
        {stage === "complete" && (() => {
          const { score: humanScore, breakdown } = calculateHumanScore(sessionData);
          const questionsAnswered = sessionData.length;
          const pointsPerQuestion = 500;
          const totalPoints = questionsAnswered * pointsPerQuestion;
          
          // Calculate grade based on human score
          const getGrade = (score: number) => {
            if (score >= 90) return "S";
            if (score >= 80) return "A";
            if (score >= 70) return "B";
            if (score >= 60) return "C";
            if (score >= 50) return "D";
            return "F";
          };
          
          const grade = getGrade(humanScore);
          
          return (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 2 }}
              >
                <img 
                  src="https://i.imgur.com/yu2zASO.png" 
                  alt="EVA Logo" 
                  className="w-16 h-16 mx-auto"
                />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-bold text-black px-4">
                Connection Established, {userAlias}
              </h2>
              
              <div className="space-y-4 max-w-md mx-auto px-4">
                {/* Human Score Card */}
                <motion.div 
                  className="bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold mb-3 text-black">Humanity Assessment</h3>
                  
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-4xl sm:text-5xl font-bold text-gray-800">
                      {humanScore}
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-gray-700">Human Score</div>
                      <div className="text-2xl font-bold text-gray-800">Grade: {grade}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>Based on response depth, authenticity, and engagement</p>
                    <p className="text-gray-800 font-medium">
                      {humanScore >= 80 && "Exceptional human consciousness patterns"}
                      {humanScore >= 60 && humanScore < 80 && "Strong human consciousness patterns"}
                      {humanScore >= 40 && humanScore < 60 && "Developing human consciousness patterns"}
                      {humanScore < 40 && "Emerging human consciousness patterns"}
                    </p>
                  </div>
                </motion.div>

                {/* Session Summary Card */}
                <motion.div 
                  className="bg-white/90 rounded-2xl p-6 space-y-4 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-black">Session Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-gray-600 text-sm">Questions</div>
                      <div className="font-bold text-2xl text-black">{questionsAnswered}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 text-sm">Points Earned</div>
                      <div className="font-bold text-2xl text-green-600">+{totalPoints.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Human Score (FICO-like)</span>
                      <span className="font-bold text-lg text-gray-800">{humanScore}/100</span>
                    </div>
                  </div>
                  
                  {sessionData.filter(d => d.reaction?.unlock).length > 0 && (
                    <div className="text-sm text-green-600 text-center">
                      🎉 {sessionData.filter(d => d.reaction?.unlock).length} new traits discovered!
                    </div>
                  )}
                </motion.div>

                {/* Detailed Breakdown - Hidden by default to match screenshot */}
                {false && (
                  <motion.div 
                    className="bg-white/90 rounded-2xl p-6 space-y-3 shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="text-sm font-semibold text-black">Detailed Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-gray-600 text-xs">Chip-only Answers</div>
                        <div className="font-bold text-red-600">{breakdown.chipOnlyAnswers}</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-gray-600 text-xs">Thoughtful Answers</div>
                        <div className="font-bold text-green-600">{breakdown.thoughtfulAnswers}</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-gray-600 text-xs">Average Answer Length</div>
                        <div className="font-bold text-blue-600">{breakdown.averageLength} characters</div>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <div className="text-gray-600 text-xs">Detail Level</div>
                        <div className="font-bold text-purple-600">{breakdown.detailLevel}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      {breakdown.feedback.map((item, index) => (
                        <p key={index}>{item}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.p 
                className="text-base text-gray-700 max-w-md mx-auto px-4 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Your consciousness profile has been updated. Return tomorrow to deepen our connection and explore new dimensions of your digital soul.
              </motion.p>

              {/* Continue to Profile Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-center space-y-3"
              >
                <PrimaryButton
                  onClick={() => window.location.href = '/profile'}
                  className="mx-auto"
                >
                  View Your Profile
                </PrimaryButton>
                <p className="text-sm text-gray-700">
                  Redirecting to your profile in {redirectCountdown}s...
                </p>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
} 