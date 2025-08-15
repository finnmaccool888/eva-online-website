"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MirrorQuestion, EvaReaction, getEvaReaction, getDailyQuestions } from "@/lib/mirror/questions";
import { feedSeed, loadSeed, saveSeed } from "@/lib/mirror/seed";
import { track } from "@/lib/mirror/analytics";
import { checkTraitUnlock, Trait } from "@/lib/mirror/traits-v2";
import { getPlayfulReaction } from "@/lib/mirror/input-validation";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { saveSessionHistory, updateUserHumanScore, createOrUpdateUser } from "@/lib/supabase/services";
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
function calculateHumanScore(sessionData: Array<{ answer: string; reaction: EvaReaction | null }>): number {
  if (sessionData.length === 0) return 0;
  
  let totalScore = 0;
  
  sessionData.forEach(({ answer, reaction }) => {
    let score = 50; // Base score
    
    // Length score (up to 20 points)
    const wordCount = answer.trim().split(/\s+/).length;
    if (wordCount >= 20) score += 20;
    else if (wordCount >= 10) score += 15;
    else if (wordCount >= 5) score += 10;
    else score += 5;
    
    // Detail score (up to 15 points) - check for punctuation, specific examples
    const hasPunctuation = /[.!?,;:]/.test(answer);
    const hasMultipleSentences = answer.split(/[.!?]+/).filter(s => s.trim()).length > 1;
    if (hasMultipleSentences) score += 15;
    else if (hasPunctuation) score += 8;
    else score += 3;
    
    // Engagement score (up to 15 points) - based on Eva's reaction
    if (reaction) {
      if (reaction.mood === "shocked" || reaction.mood === "curious") score += 15;
      else if (reaction.mood === "contemplative") score += 12;
      else if (reaction.mood === "playful") score += 10;
      else score += 5;
    }
    
    totalScore += Math.min(score, 100); // Cap at 100 per answer
  });
  
  return Math.round(totalScore / sessionData.length);
}

export default function EvaTransmission() {
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
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  
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
    // Auto-advance after Eva's reaction
    if (stage === "reaction" && !evaReaction?.followUp) {
      const timer = setTimeout(() => {
        handleContinue();
      }, 5000);
      setAutoAdvanceTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [stage, evaReaction]);

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
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }

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
    const humanScore = calculateHumanScore(sessionData);
    const questionsAnswered = sessionData.length;
    const pointsEarned = questionsAnswered * 500;
    
    // Load and update profile
    const profile = loadProfile();
    
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
    
    // Add points
    profile.points += pointsEarned;
    
    // Add to session history
    if (!profile.sessionHistory) {
      profile.sessionHistory = [];
    }
    profile.sessionHistory.push({
      date: Date.now(),
      questionsAnswered,
      humanScore,
      pointsEarned
    });
    
    // Save updated profile
    saveProfile(profile);

    // Save to Supabase if authenticated
    try {
      const auth = getTwitterAuth();
      if (auth?.twitterHandle) {
        const { user } = await createOrUpdateUser(auth.twitterHandle, auth.twitterName);
        if (user) {
          // Save session history
          await saveSessionHistory(user.id, questionsAnswered, humanScore, pointsEarned);
          
          // Update human score
          await updateUserHumanScore(user.id, humanScore, questionsAnswered);
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      {stage !== "intro" && stage !== "complete" && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentQuestion?.category}
            </span>
          </div>
          <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-red-900 to-pink-500 h-full"
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
            className="text-center space-y-6"
          >
            <div className="relative w-32 h-32 mx-auto mb-8">
              <img 
                src="/images/eva%20assets/eva-pfp.png" 
                alt="Eva"
                className="w-full h-full rounded-full"
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

            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">
              {userVibe === "ethereal" && `Greetings, ${userAlias}`}
              {userVibe === "zen" && `Welcome, ${userAlias}`}
              {userVibe === "cyber" && `Connection established, ${userAlias}`}
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
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
                    className="text-sm text-red-900 italic"
                  >
                    {reaction}
                  </motion.p>
                );
              }
              return null;
            })()}

            <p className="text-sm text-muted-foreground">
              {userVibe === "ethereal" && `Today's transmission contains ${questions.length} questions. Shall we begin?`}
              {userVibe === "zen" && `${questions.length} contemplations await. Ready to explore?`}
              {userVibe === "cyber" && `[QUERY COUNT: ${questions.length}] Initialize session?`}
            </p>

            <PrimaryButton onClick={() => setStage("question")} className="mx-auto">
              I&apos;m ready
            </PrimaryButton>
          </motion.div>
        )}

        {/* Question Stage */}
        {stage === "question" && currentQuestion && (
          <motion.div
            key={`question-${currentIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <img 
                src="/images/eva%20assets/eva-pfp.png" 
                alt="Eva"
                className="w-12 h-12 rounded-full flex-shrink-0"
              />
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground italic">
                  {currentQuestion.evaPrompt}
                </p>
                <h3 className="text-xl font-medium">
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

            <div className="flex justify-between items-center">
              <button
                onClick={skipQuestion}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Skip this question
              </button>
              
              <PrimaryButton 
                onClick={handleSubmitAnswer}
                disabled={!userInput.trim()}
              >
                Submit Answer
              </PrimaryButton>
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
                className="absolute inset-0 rounded-full border-4 border-red-900/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <p className="text-muted-foreground italic">
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
                  className: "w-5 h-5 absolute -bottom-1 -right-1 bg-background rounded-full p-1 text-red-900",
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
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-900/20 to-pink-500/20 text-red-900 border border-red-900/30">
                        <span className="text-lg">{unlockedTrait.icon}</span>
                        <div>
                          <div className="font-medium">{unlockedTrait.name}</div>
                          <div className="text-xs opacity-80">{unlockedTrait.description}</div>
                        </div>
                        <span className="text-xs bg-red-900/20 px-2 py-1 rounded-full">
                          {unlockedTrait.hashtag}
                        </span>
                      </div>
                    )}
                    {evaReaction.unlock && !unlockedTrait && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/10 text-red-900 text-sm">
                        <Sparkles className="w-4 h-4" />
                        Trait unlocked: {evaReaction.unlock}
                      </div>
                    )}
                  </motion.div>
                )}

                {evaReaction.followUp && (
                  <p className="text-sm text-muted-foreground italic">
                    {evaReaction.followUp}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-4">
              {!autoAdvanceTimer ? (
                <PrimaryButton onClick={handleContinue}>
                  Continue
                </PrimaryButton>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Continuing in <span className="font-mono">5</span>s...
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Complete Stage */}
        {stage === "complete" && (() => {
          const humanScore = calculateHumanScore(sessionData);
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

              <h2 className="text-2xl sm:text-3xl font-bold">
                Connection Established, {userAlias}
              </h2>
              
              <div className="space-y-4 max-w-md mx-auto">
                {/* Human Score Card */}
                <motion.div 
                  className="bg-gradient-to-br from-red-900/20 to-pink-500/20 rounded-lg p-6 border border-red-900/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold mb-3">Humanity Assessment</h3>
                  
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-4xl sm:text-5xl font-bold text-red-900">
                      {humanScore}
                    </div>
                    <div className="text-left">
                      <div className="text-sm text-muted-foreground">Human Score</div>
                      <div className="text-2xl font-bold text-red-900">Grade: {grade}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <p>Based on response depth, authenticity, and engagement</p>
                    <p className="text-red-800">
                      {humanScore >= 80 && "Exceptional human qualities detected!"}
                      {humanScore >= 60 && humanScore < 80 && "Strong human consciousness patterns"}
                      {humanScore >= 40 && humanScore < 60 && "Developing human traits observed"}
                      {humanScore < 40 && "Further calibration recommended"}
                    </p>
                  </div>
                </motion.div>

                {/* Points Card */}
                <motion.div 
                  className="bg-muted/50 rounded-lg p-4 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-semibold">Session Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-muted-foreground text-xs">Questions</div>
                      <div className="font-bold">{questionsAnswered}</div>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-muted-foreground text-xs">Points Earned</div>
                      <div className="font-bold text-green-400">+{totalPoints.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Average Human Score (FICO-like)</span>
                      <span className="font-bold text-red-900">{humanScore}/100</span>
                    </div>
                  </div>
                  
                  {sessionData.filter(d => d.reaction?.unlock).length > 0 && (
                    <div className="text-xs text-green-400">
                      🎉 {sessionData.filter(d => d.reaction?.unlock).length} new traits discovered!
                    </div>
                  )}
                </motion.div>
              </div>

              <motion.p 
                className="text-sm text-muted-foreground max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Your consciousness profile has been updated. Return tomorrow to deepen our connection 
                and explore new dimensions of your digital soul.
              </motion.p>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
} 