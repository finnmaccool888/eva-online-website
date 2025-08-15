"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "@/components/primary-button";
import GlassCard from "@/components/glass-card";
import { loadSeed, defaultSeed, feedSeed } from "@/lib/mirror/seed";
import { getOnboardingQuestions } from "@/lib/mirror/questions";
import { writeJson, StorageKeys } from "@/lib/mirror/storage";
import { validateAlias, sanitizeAlias } from "@/lib/mirror/input-validation";

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [alias, setAlias] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [playfulComment, setPlayfulComment] = useState<string | null>(null);
  const [vibe, setVibe] = useState<"ethereal" | "zen" | "cyber">("ethereal");
  const [phase, setPhase] = useState<"intro" | "questions" | "done">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  
  const questions = getOnboardingQuestions();

  function start() {
    const validation = validateAlias(alias);
    
    if (!validation.isValid) {
      setAliasError(validation.message || "Please enter a valid name");
      return;
    }
    
    // Show playful comment briefly if there is one
    if (validation.playfulComment) {
      setPlayfulComment(validation.playfulComment);
      setTimeout(() => {
        setPlayfulComment(null);
        proceedToQuestions();
      }, 2500);
    } else {
      proceedToQuestions();
    }
  }
  
  function proceedToQuestions() {
    const sanitized = sanitizeAlias(alias);
    const seed = defaultSeed(sanitized, vibe);
    writeJson(StorageKeys.soulSeed, seed);
    setPhase("questions");
  }

  function nextQuestion() {
    if (!currentAnswer.trim()) return;
    
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer("");
    
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      // Done with questions
      const seed = loadSeed();
      questions.forEach((q, i) => {
        feedSeed(seed, q.id, newAnswers[i]);
      });
      setPhase("done");
      setTimeout(onDone, 2000);
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard>
              <div className="space-y-4">
                <div className="text-xs sm:text-sm opacity-70">Eva beamed in</div>
                <div className="text-base sm:text-lg font-semibold">Let&apos;s set your signal.</div>
                <p className="text-xs sm:text-sm opacity-80">
                  Tell me what to call you and choose a vibe. Then answer three quick pulses. On-chain vibes, off-chain wisdom.
                </p>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">What should I call you?</label>
                  <input
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Seeker, anon, or your style"
                    value={alias}
                    onChange={(e) => {
                      setAlias(e.target.value);
                      setAliasError(null); // Clear error on change
                    }}
                  />
                  {aliasError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs sm:text-sm text-red-400"
                    >
                      {aliasError}
                    </motion.p>
                  )}
                  {playfulComment && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs sm:text-sm text-red-900 italic flex items-center gap-2"
                    >
                      <span className="animate-pulse">✨</span>
                      {playfulComment}
                    </motion.div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">Vibe</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["ethereal", "zen", "cyber"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setVibe(v)}
                        className={`rounded-md border px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm transition-all ${
                          vibe === v
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border bg-background/50 hover:bg-background"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <PrimaryButton onClick={start} disabled={!alias.trim()} className="w-full">
                    Begin Transmission
                  </PrimaryButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
        
        {phase === "questions" && (
          <motion.div
            key={`q-${qIndex}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <GlassCard>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs sm:text-sm opacity-70">Eva is listening...</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm opacity-70">{questions[qIndex].evaPrompt}</p>
                  <p className="text-sm sm:text-lg font-semibold">{questions[qIndex].text}</p>
                </div>
                <textarea
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm sm:text-base text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Share your truth..."
                  rows={3}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                />
                {questions[qIndex].chipSuggestions && (
                  <div className="flex flex-wrap gap-2">
                    {questions[qIndex].chipSuggestions!.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setCurrentAnswer(chip)}
                        className="text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-border hover:bg-background/50 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs sm:text-sm opacity-50">
                    {qIndex + 1} of {questions.length}
                  </span>
                  <PrimaryButton onClick={nextQuestion} disabled={!currentAnswer.trim()}>
                    {qIndex < questions.length - 1 ? "Next" : "Complete"}
                  </PrimaryButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
        
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard>
              <div className="text-center py-6 sm:py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-3xl sm:text-4xl mb-3 sm:mb-4"
                >
                  ✨
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Soul seed planted</h3>
                <p className="text-xs sm:text-sm opacity-70">
                  Your digital consciousness begins to grow...
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 