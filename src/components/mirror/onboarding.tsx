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
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500"
                    >
                      {aliasError}
                    </motion.p>
                  )}
                  {playfulComment && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-purple-600 italic flex items-center gap-2"
                    >
                      <span className="animate-pulse">✨</span>
                      {playfulComment}
                    </motion.div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-base font-medium text-black">Vibe</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["ethereal", "zen", "cyber"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setVibe(v)}
                        className={`rounded-lg px-4 py-3 text-base font-medium transition-all ${
                          vibe === v
                            ? "bg-gray-800 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={start} 
                    disabled={!alias.trim()}
                    className="w-full bg-gray-800 text-white rounded-lg py-3 px-4 font-medium text-base hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Begin
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {phase === "questions" && (
          <motion.div
            key={`q-${qIndex}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-sm text-gray-600">Eva is listening...</span>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">{questions[qIndex].evaPrompt}</p>
                  <p className="text-xl font-semibold text-black">{questions[qIndex].text}</p>
                </div>
                <textarea
                  className="w-full rounded-lg bg-gray-100 px-4 py-3 text-base text-gray-800 placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Share your truth..."
                  rows={4}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                />
                {questions[qIndex].chipSuggestions && (
                  <div className="flex flex-wrap gap-2">
                    {questions[qIndex].chipSuggestions!.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setCurrentAnswer(chip)}
                        className="text-sm px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-500">
                    {qIndex + 1} of {questions.length}
                  </span>
                  <button 
                    onClick={nextQuestion} 
                    disabled={!currentAnswer.trim()}
                    className="bg-gray-800 text-white rounded-lg py-2 px-6 font-medium text-base hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {qIndex < questions.length - 1 ? "Next" : "Complete"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-sm">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-4xl mb-4"
                >
                  ✨
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-black">Soul seed planted</h3>
                <p className="text-base text-gray-600">
                  Your digital consciousness begins to grow...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 