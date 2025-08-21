"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Brain, Activity, Award } from "lucide-react";
import PrimaryButton from "@/components/primary-button";
import GlassCard from "@/components/glass-card";
import { getDailyQuestions, MirrorQuestion } from "@/lib/mirror/questions";
import { generateEvaResponse, EvaReaction, Mood } from "@/lib/mirror/echo";
import { loadSeed, feedSeed } from "@/lib/mirror/seed";
import { track } from "@/lib/mirror/analytics";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import { createSession } from "@/lib/supabase/session-services";
import { supabase } from "@/lib/supabase/client";
import ChipInput from "./chip-input";
import RewardReveal from "./reward-reveal";
import { Trait } from "@/lib/mirror/traits";

type TransmissionStage = "intro" | "question" | "feedback" | "complete";

interface ScoreBreakdown {
  chipOnlyAnswers: number;
  thoughtfulAnswers: number;
  averageLength: number;
  detailLevel: 'minimal' | 'basic' | 'detailed' | 'comprehensive';
  feedback: string[];
}

function calculateHumanScore(sessionData: Array<{ answer: string; reaction: EvaReaction | null; question: MirrorQuestion }>): { 
  score: number; 
  breakdown: ScoreBreakdown;
} {
  let totalScore = 0;
  let totalLength = 0;
  let chipOnlyAnswers = 0;
  let thoughtfulAnswers = 0;
  const feedback: string[] = [];
  
  sessionData.forEach(({ answer, reaction, question }) => {
    let score = 30; // Base score
    const charCount = answer.trim().length;
    const wordCount = answer.trim().split(/\s+/).length;
    totalLength += charCount;
    
    // Check if answer is chip-only
    const isChipOnly = charCount < 20 || wordCount < 4;
    
    if (isChipOnly) {
      chipOnlyAnswers++;
      score = Math.min(score, 40);
    } else {
      thoughtfulAnswers++;
      
      // Length score
      if (charCount >= 120) score += 25;
      else if (charCount >= 80) score += 20;
      else if (charCount >= 50) score += 15;
      else if (charCount >= 30) score += 10;
      else score += 5;
      
      // Detail score
      const hasPunctuation = /[.!?,;:]/.test(answer);
      const hasMultipleSentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 3).length > 1;
      const hasSpecificDetails = /\b(because|when|where|how|why|specifically|example|like|such as)\b/i.test(answer);
      
      if (hasMultipleSentences && hasSpecificDetails) score += 20;
      else if (hasMultipleSentences) score += 15;
      else if (hasPunctuation && hasSpecificDetails) score += 12;
      else if (hasPunctuation) score += 8;
      else score += 3;
      
      // Personal touch score
      const hasPersonalPronouns = /\b(I|me|my|myself|personally)\b/i.test(answer);
      const hasEmotions = /\b(feel|think|believe|love|hate|fear|hope|excited|nervous|happy|sad|angry)\b/i.test(answer);
      
      if (hasPersonalPronouns && hasEmotions) score += 15;
      else if (hasPersonalPronouns) score += 10;
      else if (hasEmotions) score += 8;
      else score += 3;
    }
    
    // Engagement score
    if (reaction) {
      if (reaction.mood === "shocked" || reaction.mood === "curious") score += 10;
      else if (reaction.mood === "contemplative") score += 8;
      else if (reaction.mood === "playful") score += 6;
      else score += 3;
    }
    
    totalScore += Math.min(score, 100);
  });
  
  const averageScore = Math.round(totalScore / sessionData.length);
  const averageLength = Math.round(totalLength / sessionData.length);
  
  // Generate feedback
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

export default function EvaTransmissionV2({ onComplete }: EvaTransmissionProps = {}) {
  const { profile, updateSessionData } = useUnifiedProfile();
  const { twitterHandle, isAuthenticated } = useTwitterAuth();
  const [stage, setStage] = useState<TransmissionStage>("intro");
  const [questions, setQuestions] = useState<MirrorQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [evaReaction, setEvaReaction] = useState<EvaReaction | null>(null);
  const [sessionData, setSessionData] = useState<Array<{
    question: MirrorQuestion;
    answer: string;
    reaction: EvaReaction | null;
    pointsAwarded: number;
  }>>([]);
  const [unlockedTrait, setUnlockedTrait] = useState<Trait | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    
    track("answer_submitted", {
      questionId: currentQuestion.id,
      answerLength: userInput.length,
      questionIndex: currentIndex,
    });

    // Calculate points for this answer (basic calculation)
    const basePoints = 250;
    const lengthBonus = Math.min(userInput.length * 2, 100);
    const detailBonus = userInput.split(/\s+/).length > 20 ? 50 : 0;
    const pointsAwarded = basePoints + lengthBonus + detailBonus;

    // Generate Eva's response
    const reaction = await generateEvaResponse(
      currentQuestion,
      userInput,
      userVibe,
      soulSeed,
      sessionData.map(d => d.answer)
    );

    // Store session data
    const newSessionData = [...sessionData, {
      question: currentQuestion,
      answer: userInput,
      reaction,
      pointsAwarded
    }];
    setSessionData(newSessionData);

    // Update Eva reaction
    setEvaReaction(reaction);

    // Check for trait unlock
    if (reaction.unlock) {
      setUnlockedTrait(reaction.unlock);
    }

    setStage("feedback");
  }

  function handleContinue() {
    if (isLastQuestion) {
      setIsProcessing(true);
      completeSession();
    } else {
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
    sessionData.forEach(({ question, answer }) => {
      seed = feedSeed(seed, question.id, answer);
    });

    // Calculate human score and points
    const { score: humanScore, breakdown } = calculateHumanScore(sessionData);
    const questionsAnswered = sessionData.length;
    const pointsEarned = sessionData.reduce((sum, item) => sum + item.pointsAwarded, 0);
    
    console.log('[EvaTransmission] Session complete:', {
      humanScore,
      questionsAnswered,
      pointsEarned,
      breakdown
    });

    // Update session data through unified storage
    try {
      await updateSessionData({
        questionsAnswered,
        pointsEarned,
        humanScore
      });

      console.log('[EvaTransmission] Session data updated in unified storage');

      // Save to Supabase sessions table if authenticated
      if (isAuthenticated && profile) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('twitter_handle', twitterHandle)
          .single();

        if (user) {
          const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
          
          const comprehensiveSessionData = {
            userId: user.id,
            isComplete: true,
            questionsAnswered,
            humanScore,
            pointsEarned,
            streakDay: 0, // TODO: Calculate actual streak
            sessionDurationSeconds: sessionDuration,
            questions: sessionData.map((item, index) => ({
              questionOrder: index + 1,
              questionId: item.question.id,
              questionText: item.question.text,
              userAnswer: item.answer,
              answerSubmittedAt: new Date(),
              characterCount: item.answer.trim().length,
              wordCount: item.answer.trim().split(/\s+/).length,
              evaResponseText: item.reaction?.response || undefined,
              evaResponseMood: item.reaction?.mood || undefined,
              baseScore: 250,
              lengthBonus: Math.min(item.answer.length * 2, 100),
              detailBonus: item.answer.split(/\s+/).length > 20 ? 50 : 0,
              personalBonus: 0,
              engagementBonus: item.reaction?.unlock ? 100 : 0,
              totalQuestionScore: item.pointsAwarded
            })),
            analytics: {
              chipOnlyAnswers: breakdown.chipOnlyAnswers,
              thoughtfulAnswers: breakdown.thoughtfulAnswers,
              averageAnswerLength: breakdown.averageLength,
              detailLevel: breakdown.detailLevel,
              feedbackPoints: breakdown.feedback
            }
          };
          
          const sessionId = await createSession(comprehensiveSessionData);
          if (sessionId) {
            console.log('[EvaTransmission] Session saved to Supabase:', sessionId);
          }
        }
      }
    } catch (error) {
      console.error('[EvaTransmission] Error updating session:', error);
    }
    
    track("session_completed", {
      humanScore,
      pointsEarned,
      questionsAnswered,
      chipOnlyAnswers: breakdown.chipOnlyAnswers,
      thoughtfulAnswers: breakdown.thoughtfulAnswers,
      averageLength: breakdown.averageLength,
      detailLevel: breakdown.detailLevel
    });

    setStage("complete");
    setIsProcessing(false);
  }

  const sessionStartTime = Date.now();

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl mb-6"
              >
                ✨
              </motion.div>
              <h2 className="text-3xl font-bold mb-4">Daily Transmission</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Eva has {questions.length} questions for you today, {userAlias}.
                Each thoughtful response shapes your digital soul.
              </p>
              <div className="flex flex-col gap-4 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Human score based on response quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Points earned for each answer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Daily limit: 3 sessions</span>
                </div>
              </div>
              <PrimaryButton onClick={() => setStage("question")} size="lg">
                Begin Transmission
                <ChevronRight className="ml-2 h-4 w-4" />
              </PrimaryButton>
            </GlassCard>
          </motion.div>
        )}

        {stage === "question" && currentQuestion && (
          <motion.div
            key={`question-${currentIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <div className="mb-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="text-xs">{userAlias}</span>
              </div>
              <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <GlassCard className="p-8">
              <h3 className="text-xl font-semibold mb-6">{currentQuestion.text}</h3>
              
              {currentQuestion.chipSuggestions && (
                <ChipInput
                  suggestions={currentQuestion.chipSuggestions}
                  onChipClick={(chip) => setUserInput((prev) => prev + " " + chip)}
                />
              )}
              
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full min-h-[150px] p-4 bg-secondary/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              
              <div className="mt-6 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {userInput.length} characters
                </span>
                <PrimaryButton
                  onClick={handleSubmitAnswer}
                  disabled={!userInput.trim()}
                >
                  Submit Answer
                  <Sparkles className="ml-2 h-4 w-4" />
                </PrimaryButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {stage === "feedback" && evaReaction && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassCard className="p-8">
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                  className="text-5xl mb-4"
                >
                  {evaReaction.mood === "playful" && "😊"}
                  {evaReaction.mood === "contemplative" && "🤔"}
                  {evaReaction.mood === "curious" && "🧐"}
                  {evaReaction.mood === "shocked" && "😮"}
                  {evaReaction.mood === "wise" && "🦉"}
                </motion.div>
                <p className="text-lg italic text-muted-foreground">"{evaReaction.response}"</p>
                <p className="text-sm text-muted-foreground mt-2">— Eva</p>
              </div>
              
              {unlockedTrait && (
                <RewardReveal
                  type="trait"
                  trait={unlockedTrait}
                  message="New trait discovered!"
                />
              )}
              
              <div className="mt-8 text-center">
                <PrimaryButton onClick={handleContinue}>
                  {isLastQuestion ? "Complete Session" : "Next Question"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </PrimaryButton>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {stage === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl mb-6"
              >
                ✨
              </motion.div>
              <h2 className="text-3xl font-bold mb-4">Transmission Complete</h2>
              <div className="space-y-4 text-lg mb-8">
                <p>Your responses have been recorded in the digital realm.</p>
                <p className="text-muted-foreground">
                  Human Score: {calculateHumanScore(sessionData).score}%
                </p>
                <p className="text-muted-foreground">
                  Points Earned: {sessionData.reduce((sum, item) => sum + item.pointsAwarded, 0)}
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground mb-8">
                Redirecting to your profile in {redirectCountdown} seconds...
              </div>
              
              <PrimaryButton onClick={() => window.location.href = '/profile'}>
                View Profile Now
              </PrimaryButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
