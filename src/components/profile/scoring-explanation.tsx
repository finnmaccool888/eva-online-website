"use client";

import React from "react";
import { Info, TrendingUp, Star, Award } from "lucide-react";

export default function ScoringExplanation({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Info className="w-5 h-5 text-pink-600" />
            How Eva Scores Your Responses
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Quality Scoring */}
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-600" />
              Quality Score (1-10)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-red-600">1-2: Single words, obvious nonsense</span>
                <span className="text-red-600 font-mono font-medium">Very Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600">3-4: Very basic, minimal effort</span>
                <span className="text-orange-600 font-mono font-medium">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">5-6: Basic but genuine attempt</span>
                <span className="text-yellow-600 font-mono font-medium">Fair</span>
              </div>
              <div className="flex justify-between items-center bg-green-100 px-3 py-2 rounded-lg border border-green-200">
                <span className="text-green-700 font-medium">7-8: Good effort, authentic (DEFAULT)</span>
                <span className="text-green-700 font-mono font-bold">Good</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">9-10: Exceptional depth, vulnerability</span>
                <span className="text-blue-600 font-mono font-medium">Excellent</span>
              </div>
            </div>
          </div>

          {/* Sincerity Scoring */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />
              Sincerity Score (1-10)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-red-600">1-2: Obviously fake, trolling</span>
                <span className="text-red-600 font-mono font-medium">Very Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600">3-4: Seems rushed but not malicious</span>
                <span className="text-orange-600 font-mono font-medium">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">5-6: Genuine but brief or guarded</span>
                <span className="text-yellow-600 font-mono font-medium">Fair</span>
              </div>
              <div className="flex justify-between items-center bg-green-100 px-3 py-2 rounded-lg border border-green-200">
                <span className="text-green-700 font-medium">7-8: Authentic, shows real thought (DEFAULT)</span>
                <span className="text-green-700 font-mono font-bold">Good</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">9-10: Deeply honest, very meaningful</span>
                <span className="text-blue-600 font-mono font-medium">Excellent</span>
              </div>
            </div>
          </div>

          {/* Points Calculation */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              Points Calculation
            </h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-purple-300">
                <p className="font-mono text-center text-lg text-gray-900">
                  Points = (Quality + Sincerity) × 25
                </p>
              </div>
              <div className="text-sm space-y-1 text-gray-700">
                <p><strong>Example 1:</strong> Quality 7 + Sincerity 8 = 15 × 25 = <span className="text-green-600 font-bold">375 points</span></p>
                <p><strong>Example 2:</strong> Quality 8 + Sincerity 9 = 17 × 25 = <span className="text-blue-600 font-bold">425 points</span></p>
                <p><strong>Example 3:</strong> Quality 9 + Sincerity 10 = 19 × 25 = <span className="text-purple-600 font-bold">475 points</span></p>
              </div>
            </div>
          </div>

          {/* Key Principles */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-lg mb-3 text-gray-900">🎯 Key Principles</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span><strong>Default to 7-8</strong> for any genuine human response that shows effort</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span><strong>Encourage authenticity</strong> over perfect writing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span><strong>Recognize effort</strong> even if answers are brief</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span><strong>Only penalize</strong> obvious spam, testing, or offensive content</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}