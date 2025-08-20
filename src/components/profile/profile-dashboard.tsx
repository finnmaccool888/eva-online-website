"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserProfile } from "@/lib/mirror/types";
import { loadProfile, saveProfile } from "@/lib/mirror/profile";
import { loadUserData, createOrUpdateUser } from "@/lib/supabase/services";
import { usePointsSync } from "@/lib/hooks/usePointsSync";
import ProfileHeader from "./profile-header";
import StatsCards from "./stats-cards";
import LeaderboardWidget from "./leaderboard-widget";
import SessionHistory from "./session-history";
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import Navbar from "@/components/navbar";

interface ProfileDashboardProps {
  auth: {
    twitterId: string;
    twitterHandle: string;
    twitterName: string;
    profileImage: string;
    isOG: boolean;
  };
}

export default function ProfileDashboard({ auth }: ProfileDashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { points, refreshPoints, isRefreshing } = usePointsSync();

  // Update profile when points change
  useEffect(() => {
    if (points !== null && profile) {
      const updatedProfile = {
        ...profile,
        points
      };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
    }
  }, [points]);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log('[ProfileDashboard] Loading profile data from Supabase for:', auth.twitterHandle);
        
        // First, ensure user exists in Supabase and OG points are enforced
        const { user, isNew, ogPointsAwarded } = await createOrUpdateUser(auth.twitterHandle, auth.twitterName, auth.isOG);
        
        if (!user) {
          console.error('[ProfileDashboard] Failed to create/get user');
          setLoading(false);
          return;
        }
        
        if (ogPointsAwarded) {
          console.log('[ProfileDashboard] OG points were enforced for user');
        }

        // Load complete user data from Supabase
        const userData = await loadUserData(auth.twitterHandle);
        
        if (userData?.profile) {
          // Convert Supabase profile to UserProfile format
          const supabaseProfile = userData.profile;
          const userProfile: UserProfile = {
            twitterId: auth.twitterId,
            twitterHandle: auth.twitterHandle,
            twitterVerified: true,
            personalInfo: supabaseProfile.personal_info || {},
            socialProfiles: supabaseProfile.social_profiles || [],
            points: (points ?? supabaseProfile.points) || 0, // Use real-time points if available
            trustScore: supabaseProfile.trust_score || 50,
            createdAt: new Date(supabaseProfile.created_at).getTime(),
            updatedAt: new Date(supabaseProfile.updated_at).getTime(),
            humanScore: supabaseProfile.human_score || 0,
            totalQuestionsAnswered: supabaseProfile.total_questions_answered || 0,
            sessionHistory: supabaseProfile.session_history || [],
            isOG: auth.isOG,
            ogPointsAwarded: supabaseProfile.is_og_rewarded || false
          };

          console.log('[ProfileDashboard] Loaded profile from Supabase:', {
            points: userProfile.points,
            humanScore: userProfile.humanScore,
            totalQuestions: userProfile.totalQuestionsAnswered,
            sessionCount: userProfile.sessionHistory?.length || 0
          });

          setProfile(userProfile);
          
          // Also sync to localStorage for compatibility
          saveProfile(userProfile);
          
          // Sync the correct calculated points to Supabase
          const { syncCompleteProfile } = await import('@/lib/supabase/sync-profile');
          await syncCompleteProfile();
        } else {
          // No profile data yet - use default profile
          const defaultProfile: UserProfile = {
            twitterId: auth.twitterId,
            twitterHandle: auth.twitterHandle,
            twitterVerified: true,
            personalInfo: {},
            socialProfiles: [],
            points: auth.isOG ? 10000 : 0,
            trustScore: 50,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            humanScore: 0,
            totalQuestionsAnswered: 0,
            sessionHistory: [],
            isOG: auth.isOG,
            ogPointsAwarded: auth.isOG
          };
          
          console.log('[ProfileDashboard] Using default profile for new user');
          setProfile(defaultProfile);
          saveProfile(defaultProfile);
        }
      } catch (error) {
        console.error('[ProfileDashboard] Error loading profile:', error);
        
        // Fallback to localStorage
        const localProfile = loadProfile();
        if (localProfile) {
          console.log('[ProfileDashboard] Fallback to localStorage profile');
          setProfile(localProfile);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [auth.twitterHandle, auth.twitterId, auth.twitterName, auth.isOG, points]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900">
        <Navbar inverse />
        <div className="flex items-center justify-center h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900">
        <Navbar inverse />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
            <p className="text-gray-600">
              Complete your first Mirror session to create your profile.
            </p>
            <a
              href="/mirror"
              className="inline-block px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Start Mirror Session
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900">
      <Navbar inverse />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <ProfileHeader auth={auth} profile={profile} />
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPoints}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Points'}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatsCards profile={profile} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <LeaderboardWidget currentUser={auth} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <SessionHistory profile={profile} onUpdateProfile={setProfile} />
          </motion.div>
        </div>
      </div>
    </div>
  );
} 