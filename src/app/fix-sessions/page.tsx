"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { Trash2, Check } from "lucide-react";
import Navbar from "@/components/navbar";

export default function FixSessionsPage() {
  const { auth, loading } = useTwitterAuth();
  const [profile, setProfile] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (auth) {
      const userProfile = loadProfile();
      setProfile(userProfile);
    }
  }, [auth]);

  const removeDuplicateSessions = () => {
    if (!profile || selectedSessions.length === 0) return;

    const updatedProfile = { ...profile };
    
    // Remove selected sessions (in reverse order to maintain indices)
    const sortedIndices = [...selectedSessions].sort((a, b) => b - a);
    sortedIndices.forEach(index => {
      updatedProfile.sessionHistory.splice(index, 1);
    });

    // Recalculate totals
    if (updatedProfile.sessionHistory.length > 0) {
      const totalSessions = updatedProfile.sessionHistory.length;
      const avgHumanScore = updatedProfile.sessionHistory.reduce((sum, session) => sum + session.humanScore, 0) / totalSessions;
      updatedProfile.humanScore = Math.round(avgHumanScore);
      updatedProfile.totalQuestionsAnswered = updatedProfile.sessionHistory.reduce((sum, session) => sum + session.questionsAnswered, 0);
    }

    updatedProfile.updatedAt = Date.now();
    saveProfile(updatedProfile);
    setProfile(updatedProfile);
    setSelectedSessions([]);
    setMessage(`Removed ${sortedIndices.length} session(s) successfully!`);
    
    setTimeout(() => setMessage(""), 3000);
  };

  const toggleSession = (index: number) => {
    setSelectedSessions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-gray-600">Please log in to manage your sessions.</p>
          <a
            href="/mirror"
            className="inline-block px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Go to Mirror
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900">
      <Navbar inverse />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-2">Fix Duplicate Sessions</h1>
          <p className="text-gray-600 mb-8">
            Select duplicate sessions to remove them from your history.
          </p>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              {message}
            </motion.div>
          )}

          {profile?.sessionHistory && profile.sessionHistory.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
                <div className="space-y-2">
                  {profile.sessionHistory.map((session, index) => {
                    const date = new Date(session.date);
                    const isSelected = selectedSessions.includes(index);
                    
                    return (
                      <div
                        key={`${session.date}-${index}`}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleSession(index)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Score: {session.humanScore}/100 • 
                              Points: +{session.pointsEarned} • 
                              Questions: {session.questionsAnswered}
                            </p>
                          </div>
                          {isSelected && (
                            <Trash2 className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedSessions.length > 0 && (
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={removeDuplicateSessions}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remove {selectedSessions.length} Session{selectedSessions.length > 1 ? 's' : ''}
                    </button>
                    <button
                      onClick={() => setSelectedSessions([])}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Removing sessions will recalculate your average human score and total questions answered. 
                  Points from removed sessions will not be refunded.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No sessions found.</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/profile"
              className="text-pink-600 hover:text-pink-700 transition-colors"
            >
              ← Back to Profile
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
