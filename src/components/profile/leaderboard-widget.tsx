"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Award, TrendingUp } from "lucide-react";
import { loadProfile } from "@/lib/mirror/profile";

interface LeaderboardEntry {
  rank: number;
  twitterHandle: string;
  twitterName: string;
  profileImage: string;
  points: number;
  humanScore: number;
  isOG: boolean;
}

interface LeaderboardWidgetProps {
  currentUser: {
    twitterHandle: string;
    twitterName: string;
    profileImage: string;
    isOG: boolean;
  };
}

export default function LeaderboardWidget({ currentUser }: LeaderboardWidgetProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        
        // Get current user profile to pass to API
        const currentProfile = loadProfile();
        const headers: HeadersInit = {};
        
        if (currentProfile) {
          headers['x-user-profile'] = encodeURIComponent(JSON.stringify(currentProfile));
        }
        
        const response = await fetch('/api/leaderboard', { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUser]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <span className="text-gray-600 font-bold">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <h2 className="text-xl font-semibold text-gray-900">Leaderboard</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-7">Coming soon</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-900" />
          <h2 className="text-xl font-semibold text-gray-900">Global Leaderboard</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1 ml-7">Coming soon</p>
      </div>

      {error && (
        <div className="text-sm text-gray-500 mb-4">
          Unable to load leaderboard data
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {leaderboard.slice(0, 10).map((entry, index) => {
          const isCurrentUser = entry.twitterHandle === currentUser.twitterHandle;
          
          return (
            <motion.div
              key={entry.twitterHandle}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-pink-100 border border-pink-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="relative">
                <img
                  src={entry.profileImage}
                  alt={entry.twitterName}
                  className="w-8 h-8 rounded-full"
                />
                {entry.isOG && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                    <Crown className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-pink-700' : 'text-gray-900'}`}>
                  {entry.twitterName}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  @{entry.twitterHandle}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-bold">
                  {entry.points.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  {entry.humanScore}/100
                </p>
              </div>
            </motion.div>
          );
        })}
        </div>
      )}
    </div>
  );
} 