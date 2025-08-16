"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, TrendingUp } from "lucide-react";
import { SessionLimitStatus, formatTimeUntilNextSession } from "@/lib/mirror/session-limits";

interface SessionLimitReachedProps {
  limitStatus: SessionLimitStatus;
  onBack: () => void;
}

export default function SessionLimitReached({ limitStatus, onBack }: SessionLimitReachedProps) {
  const [timeRemaining, setTimeRemaining] = useState("");
  
  useEffect(() => {
    // Update time remaining every minute
    const updateTime = () => {
      if (limitStatus.nextAvailableTime) {
        setTimeRemaining(formatTimeUntilNextSession(limitStatus.nextAvailableTime));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [limitStatus.nextAvailableTime]);
  
  const nextSessionDate = limitStatus.nextAvailableTime 
    ? new Date(limitStatus.nextAvailableTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : null;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
              <Clock className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Limit Reached</h2>
            <p className="text-gray-600">You've completed your daily mirror sessions</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Sessions Used</span>
              <span className="text-lg font-semibold text-gray-900">{limitStatus.sessionsUsed}/3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(limitStatus.sessionsUsed / 3) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">Rolling 24-hour period</p>
          </div>
          
          {limitStatus.nextAvailableTime && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-600">Next session available in</p>
                  <p className="text-lg font-semibold text-gray-900">{timeRemaining}</p>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 bg-pink-50 rounded-lg p-3 border border-pink-200">
                <p className="font-medium text-pink-900 mb-1">Why the limit?</p>
                <p className="text-pink-700">
                  To ensure meaningful reflection and prevent point farming, each user can complete up to 3 sessions per rolling 24-hour period. Come back at {nextSessionDate} for your next session!
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <a
              href="/profile"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              View Your Progress
            </a>
            
            <button
              onClick={onBack}
              className="w-full px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Mirror
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
