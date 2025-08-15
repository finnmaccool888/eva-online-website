"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserProfile } from "@/lib/mirror/types";
import { Crown, Star, TrendingUp, Award, LogOut } from "lucide-react";
import { logout } from "@/lib/mirror/auth";
import { calculateTotalPoints } from "@/lib/mirror/profile";

interface ProfileHeaderProps {
  auth: {
    twitterId: string;
    twitterHandle: string;
    twitterName: string;
    profileImage: string;
    isOG: boolean;
  };
  profile: UserProfile;
}

export default function ProfileHeader({ auth, profile }: ProfileHeaderProps) {
  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out? This will clear all your local data.")) {
      try {
        await logout();
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };
  
  // Use unified points calculation
  const actualPoints = calculateTotalPoints(profile);

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6">
      {/* Logout Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Profile Image & Basic Info */}
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <img
              src={auth.profileImage}
              alt={auth.twitterName}
              className="w-20 h-20 rounded-full border-2 border-slate-300/60"
            />
            {auth.isOG && (
              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
          </motion.div>
          
          <div>
            <h1 className="text-2xl font-bold">{auth.twitterName}</h1>
            <p className="text-muted-foreground">@{auth.twitterHandle}</p>
            {auth.isOG && (
              <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-500 font-medium">OG Member</span>
              </div>
            )}
          </div>
        </div>

        {/* Key Stats */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 ml-0 md:ml-8">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{actualPoints.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{profile.humanScore || 0}</div>
            <div className="text-sm text-muted-foreground">Human Score</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-500">{profile.totalQuestionsAnswered || 0}</div>
            <div className="text-sm text-muted-foreground">Questions</div>
          </div>
          
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-500">
              {profile.sessionHistory?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </div>
        </div>
      </div>

      {/* Status Messages - Only show intentional, permanent badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.sessionHistory && profile.sessionHistory.length === 1 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
            <Award className="w-4 h-4" />
            First Session Complete!
          </div>
        )}
        
        {/* Removed automatic "Elite Member" and "High Quality Responses" badges 
            to prevent unintentional titles that could disappear */}
      </div>
    </div>
  );
} 