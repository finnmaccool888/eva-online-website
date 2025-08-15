"use client";

import React from "react";
import { Info, TrendingUp, Star, Award } from "lucide-react";

export default function ScoringExplanation({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-lg border border-border p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Info className="w-5 h-5" />
            How Eva Scores Your Responses
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Quality Scoring */}
          <div className="bg-card/60 rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Quality Score (1-10)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-red-400">1-2: Single words, obvious nonsense</span>
                <span className="text-red-400 font-mono">Very Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-400">3-4: Very basic, minimal effort</span>
                <span className="text-orange-400 font-mono">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-400">5-6: Basic but genuine attempt</span>
                <span className="text-yellow-400 font-mono">Fair</span>
              </div>
              <div className="flex justify-between items-center bg-primary/10 px-2 py-1 rounded">
                <span className="text-green-400 font-medium">7-8: Good effort, authentic (DEFAULT)</span>
                <span className="text-green-400 font-mono font-bold">Good</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400">9-10: Exceptional depth, vulnerability</span>
                <span className="text-blue-400 font-mono">Excellent</span>
              </div>
            </div>
          </div>

          {/* Sincerity Scoring */}
          <div className="bg-card/60 rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Sincerity Score (1-10)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-red-400">1-2: Obviously fake, trolling</span>
                <span className="text-red-400 font-mono">Very Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-400">3-4: Seems rushed but not malicious</span>
                <span className="text-orange-400 font-mono">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-400">5-6: Genuine but brief or guarded</span>
                <span className="text-yellow-400 font-mono">Fair</span>
              </div>
              <div className="flex justify-between items-center bg-primary/10 px-2 py-1 rounded">
                <span className="text-green-400 font-medium">7-8: Authentic, shows real thought (DEFAULT)</span>
                <span className="text-green-400 font-mono font-bold">Good</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400">9-10: Deeply honest, very meaningful</span>
                <span className="text-blue-400 font-mono">Excellent</span>
              </div>
            </div>
          </div>

          {/* Points Calculation */}
          <div className="bg-card/60 rounded-lg p-4 border border-border">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Points Calculation
            </h3>
            <div className="space-y-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="font-mono text-center text-lg">
                  Points = (Quality + Sincerity) × 25
                </p>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Example 1:</strong> Quality 7 + Sincerity 8 = 15 × 25 = <span className="text-green-400 font-bold">375 points</span></p>
                <p><strong>Example 2:</strong> Quality 8 + Sincerity 9 = 17 × 25 = <span className="text-blue-400 font-bold">425 points</span></p>
                <p><strong>Example 3:</strong> Quality 9 + Sincerity 10 = 19 × 25 = <span className="text-purple-400 font-bold">475 points</span></p>
              </div>
            </div>
          </div>

          {/* Key Principles */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <h3 className="font-semibold text-lg mb-3">🎯 Key Principles</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Default to 7-8</strong> for any genuine human response that shows effort</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Encourage authenticity</strong> over perfect writing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Recognize effort</strong> even if answers are brief</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Only penalize</strong> obvious spam, testing, or offensive content</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 