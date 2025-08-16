"use client";

import React, { useState } from "react";
import { calculateQuestionPoints } from "@/lib/mirror/session-analysis";

export default function TestScoringPage() {
  const [quality, setQuality] = useState(7);
  const [sincerity, setSincerity] = useState(8);

  // Calculate points using the formula
  const points = (quality + sincerity) * 25;
  
  // Test scenarios
  const testScenarios = [
    { quality: 10, sincerity: 10, expected: 500 },
    { quality: 9, sincerity: 9, expected: 450 },
    { quality: 8, sincerity: 8, expected: 400 },
    { quality: 7, sincerity: 7, expected: 350 },
    { quality: 5, sincerity: 5, expected: 250 },
    { quality: 1, sincerity: 1, expected: 50 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Scoring System Test</h1>
        
        {/* Interactive Calculator */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Points Calculator</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Score: {quality}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sincerity Score: {sincerity}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={sincerity}
                onChange={(e) => setSincerity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <p className="text-center text-lg font-mono">
                ({quality} + {sincerity}) × 25 = <span className="text-2xl font-bold text-pink-600">{points}</span> points
              </p>
            </div>
          </div>
        </div>
        
        {/* Test Scenarios */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Test Scenarios</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4">Quality</th>
                  <th className="text-left py-2 px-4">Sincerity</th>
                  <th className="text-left py-2 px-4">Formula</th>
                  <th className="text-left py-2 px-4">Expected</th>
                  <th className="text-left py-2 px-4">Actual</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {testScenarios.map((scenario, idx) => {
                  const actual = (scenario.quality + scenario.sincerity) * 25;
                  const isCorrect = actual === scenario.expected;
                  
                  return (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 px-4">{scenario.quality}</td>
                      <td className="py-2 px-4">{scenario.sincerity}</td>
                      <td className="py-2 px-4 font-mono text-xs">
                        ({scenario.quality} + {scenario.sincerity}) × 25
                      </td>
                      <td className="py-2 px-4 font-bold">{scenario.expected}</td>
                      <td className="py-2 px-4 font-bold">{actual}</td>
                      <td className="py-2 px-4">
                        {isCorrect ? (
                          <span className="text-green-600">✅ Correct</span>
                        ) : (
                          <span className="text-red-600">❌ Error</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Session Maximum</h3>
            <p className="text-green-700">
              With 5 questions per session and max 500 points per question:
            </p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              Maximum session points = 5 × 500 = 2,500 points
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
