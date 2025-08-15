"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { OG_MESSAGE, OG_IMAGE_URL, OG_POINTS } from "@/lib/mirror/og-verification";

interface OGPopupProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function OGPopup({ isOpen, onClose, username }: OGPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <div
              className="relative max-w-lg w-full bg-gradient-to-br from-red-900/90 to-pink-900/90 rounded-2xl border border-red-900/50 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
              >
                <X className="h-6 w-6" />
              </button>
              
              {/* Content */}
              <div className="relative p-6 sm:p-8">
                {/* Sparkle effects */}
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute top-4 left-4"
                >
                  <Sparkles className="h-8 w-8 text-red-900" />
                </motion.div>
                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute bottom-4 right-4"
                >
                  <Sparkles className="h-6 w-6 text-pink-400" />
                </motion.div>
                
                <div className="text-center space-y-6">
                  {/* OG Badge Image */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="relative"
                  >
                    <img
                      src={OG_IMAGE_URL}
                      alt="EVA OG Badge"
                      className="w-48 h-48 mx-auto rounded-full border-4 border-red-900 shadow-lg"
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 rounded-full border-4 border-red-900/50"
                    />
                  </motion.div>
                  
                  {/* Welcome message */}
                  <div className="space-y-3">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl font-bold text-white"
                    >
                      Welcome, {username}!
                    </motion.h2>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl text-red-800"
                    >
                      {OG_MESSAGE}
                    </motion.p>
                  </div>
                  
                  {/* Points award */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="bg-red-900/20 rounded-lg p-4 border border-red-900/50"
                  >
                    <div className="text-red-800 text-sm mb-1">OG BONUS AWARDED</div>
                    <div className="text-4xl font-bold text-red-900">
                      +{OG_POINTS.toLocaleString()} Points
                    </div>
                  </motion.div>
                  
                  {/* Continue button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={onClose}
                    className="px-8 py-3 bg-gradient-to-r from-red-800 to-red-600 text-white font-medium rounded-lg hover:from-red-900 hover:to-red-700 transition-all transform hover:scale-105"
                  >
                    Continue to EVA
                  </motion.button>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 