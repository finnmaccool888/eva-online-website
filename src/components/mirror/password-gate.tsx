"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PasswordGateProps {
  isOG: boolean;
  onSuccess: () => void;
  onProfileRedirect: () => void;
}

const CORRECT_PASSWORD = "enterthemirrorstate";

export default function PasswordGate({ isOG, onSuccess, onProfileRedirect }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password.toLowerCase() === CORRECT_PASSWORD) {
      if (isOG) {
        onSuccess();
      } else {
        setError("Access denied. OG members only for the first module.");
      }
    } else {
      setError("Incorrect password. Try again.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8"
      >
        {/* OG Status Badge */}
        {isOG && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 text-yellow-600"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">OG EARLY ACCESS</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>
        )}

        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="text-center space-y-4 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto"
            >
              <img 
                src="https://i.imgur.com/S81wjZD.png" 
                alt="Lock" 
                className="w-8 h-8"
              />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900">Enter the Mirror State</h2>
            
            {isOG ? (
              <p className="text-gray-600">
                As an OG member, you have exclusive early access to EVA's Mirror module.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-600">
                  The Mirror module is currently in OG-only early access.
                </p>
                <p className="text-yellow-600 text-sm font-medium">
                  You can still create your profile and prepare for the next module!
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 pr-10 focus:border-pink-400 focus:ring-pink-400"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm text-center font-medium"
              >
                {error}
              </motion.p>
            )}

            <div className="space-y-3">
              {isOG ? (
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={isSubmitting || !password}
                >
                  {isSubmitting ? "Verifying..." : "Enter the Mirror"}
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                    disabled={isSubmitting || !password}
                  >
                    {isSubmitting ? "Checking..." : "Try Anyway"}
                  </Button>
                  <Button
                    type="button"
                    onClick={onProfileRedirect}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    Go to Profile Setup
                  </Button>
                </>
              )}
            </div>
          </form>

          {!isOG && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p className="text-sm text-yellow-700 text-center">
                <strong>Note:</strong> Even with the correct password, only OG members can access the Mirror module during early access.
              </p>
            </motion.div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600">
          Need help? Contact support on Twitter @evaonlinexyz
        </p>
      </motion.div>
    </div>
  );
} 