"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "@/components/primary-button";
import GlassCard from "@/components/glass-card";
import { loadSeed, defaultSeed, feedSeed } from "@/lib/mirror/seed";
import { getOnboardingQuestions } from "@/lib/mirror/questions";
import { writeJson, StorageKeys } from "@/lib/mirror/storage";
import { validateAlias, sanitizeAlias } from "@/lib/mirror/input-validation";

interface OnboardingV2Props {
  onDone: (alias: string, vibe: "ethereal" | "zen" | "cyber") => void;
}

export default function OnboardingV2({ onDone }: OnboardingV2Props) {
  const [alias, setAlias] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [playfulComment, setPlayfulComment] = useState<string | null>(null);
  const [vibe, setVibe] = useState<"ethereal" | "zen" | "cyber">("ethereal");
  const [phase, setPhase] = useState<"intro" | "questions" | "done">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  async function nextQuestion() {
    if (!currentAnswer.trim()) return;
    
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer("");
    
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      // Done with questions
      setIsSubmitting(true);
      
      const seed = loadSeed();
      questions.forEach((q, i) => {
        feedSeed(seed, q.id, newAnswers[i]);
      });
      
      setPhase("done");
      
      // Pass the alias and vibe to parent to persist to Supabase
      setTimeout(() => {
        onDone(sanitizeAlias(alias), vibe);
      }, 2000);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-sm">
              <div className="space-y-6">
                <div className="text-sm text-gray-600">Eva beamed in</div>
                <div className="text-2xl font-bold text-black">Let's set your signal.</div>
                <p className="text-base text-gray-700 leading-relaxed">
                  Tell me what to call you and choose a vibe. Then answer three quick pulses. On-chain vibes, off-chain wisdom.
                </p>
                <div className="space-y-3">
                  <label className="text-base font-medium text-black">What should I call you?</label>
                  <input
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Seeker, anon, or your style"
                    value={alias}
                    onChange={(e) => {
                      setAlias(e.target.value);
                      setAliasError(null); // Clear error on change
                    }}
                  />
                  {aliasError && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-red-500"
                    >
                      {aliasError}
                    </motion.p>
                  )}
                  {playfulComment && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-purple-600 italic"
                    >
                      {playfulComment}
                    </motion.p>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-base font-medium text-black">Pick your flow</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "ethereal", label: "Ethereal" },
                      { id: "zen", label: "Zen" },
                      { id: "cyber", label: "Cyber" }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setVibe(option.id as typeof vibe)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          vibe === option.id
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <PrimaryButton 
                  onClick={start} 
                  fullWidth 
                  disabled={!alias.trim() || isSubmitting}
                >
                  {isSubmitting ? "Setting up..." : "Set the vibe"}
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "questions" && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Pulse {qIndex + 1}/3</div>
                  <div className="text-xs text-gray-500">{alias}</div>
                </div>
                <div className="text-xl font-bold text-black">{questions[qIndex].text}</div>
                {questions[qIndex].chipSuggestions && (
                  <div className="flex flex-wrap gap-2">
                    {questions[qIndex].chipSuggestions!.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setCurrentAnswer(chip)}
                        className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  className="w-full rounded-lg bg-gray-100 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  placeholder="Speak your truth..."
                  rows={4}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  disabled={isSubmitting}
                />
                <PrimaryButton 
                  onClick={nextQuestion} 
                  fullWidth 
                  disabled={!currentAnswer.trim() || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : (qIndex < questions.length - 1 ? "Next" : "Finish")}
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-white/90 backdrop-blur rounded-2xl p-12 shadow-sm text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl mb-4"
              >
                ✨
              </motion.div>
              <div className="text-2xl font-bold text-black mb-2">Signal set.</div>
              <div className="text-base text-gray-600">Your soul seed is planted, {alias}.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
