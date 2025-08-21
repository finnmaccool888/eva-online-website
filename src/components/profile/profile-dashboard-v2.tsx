"use client";

import React, { useEffect } from "react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import ProfileHeader from "./profile-header";
import StatsCards from "./stats-cards";
import PointsBreakdown from "./points-breakdown";
import SessionHistory from "./session-history";
import LeaderboardWidget from "./leaderboard-widget";
import ScoringExplanation from "./scoring-explanation";
import ScoreComparison from "./score-comparison";
import { Loader2 } from "lucide-react";

interface ProfileDashboardProps {
  auth: {
    twitterId: string;
    twitterHandle: string;
    twitterName: string;
    profileImage: string;
    isOG: boolean;
  };
}

export default function ProfileDashboardV2({ auth }: ProfileDashboardProps) {
  const {
    profile,
    loading,
    error,
    isOG,
    points,
    hasOnboarded,
    refreshProfile,
    updateProfile
  } = useUnifiedProfile();

  // Log profile state for debugging
  useEffect(() => {
    console.log('[ProfileDashboard] State:', {
      loading,
      hasProfile: !!profile,
      error,
      auth: {
        twitterHandle: auth.twitterHandle,
        isOG: auth.isOG
      }
    });
    
    if (profile) {
      console.log('[ProfileDashboard] Profile loaded:', {
        points: profile.points,
        isOG: profile.isOG,
        hasOnboarded: profile.hasOnboarded,
        sessionCount: profile.sessionHistory?.length || 0,
        humanScore: profile.humanScore
      });
    }
  }, [profile, loading, error, auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <div className="text-center">
            <p className="text-muted-foreground">Loading profile...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Fetching your data from Eva's servers
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || 'Failed to load profile'}</p>
          <button
            onClick={() => refreshProfile()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Create user object for components that expect it
  const user = {
    twitterHandle: auth.twitterHandle,
    twitterName: auth.twitterName,
    profileImage: auth.profileImage,
    twitterId: auth.twitterId,
    isOG: isOG,
    points: points,
    humanScore: profile.humanScore || 0,
    createdAt: new Date(profile.createdAt).toISOString()
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          auth={auth}
          profile={profile}
        />

        {/* Points Breakdown */}
        <PointsBreakdown
          basePoints={1000}
          ogBonus={isOG ? 10000 : 0}
          sessionPoints={profile.sessionHistory?.reduce((sum, s) => sum + (s.pointsEarned || 0), 0) || 0}
          profilePoints={calculateProfilePoints(profile)}
          totalPoints={points}
        />

        {/* Stats Cards */}
        <StatsCards
          humanScore={profile.humanScore || 0}
          totalQuestions={profile.totalQuestionsAnswered || 0}
          currentStreak={profile.currentStreak || 0}
          longestStreak={profile.longestStreak || 0}
        />

        {/* Score Comparison */}
        {profile.humanScore !== undefined && profile.humanScore > 0 && (
          <ScoreComparison humanScore={profile.humanScore} />
        )}

        {/* Session History */}
        {profile.sessionHistory && profile.sessionHistory.length > 0 && (
          <SessionHistory 
            sessions={profile.sessionHistory} 
            twitterHandle={auth.twitterHandle}
          />
        )}

        {/* Leaderboard Widget */}
        <LeaderboardWidget currentUser={auth.twitterHandle} />

        {/* Scoring Explanation */}
        <ScoringExplanation />
      </div>
    </div>
  );
}

// Calculate points from profile completion
function calculateProfilePoints(profile: any): number {
  let points = 0;
  
  // Twitter verification
  if (profile.twitterVerified) points += 1000;
  
  // Personal info completion (333 points per field)
  const personalFields = [
    profile.personalInfo?.fullName,
    profile.personalInfo?.location,
    profile.personalInfo?.bio
  ];
  const filledFields = personalFields.filter(f => f && f.trim().length > 0).length;
  points += filledFields * 333;
  
  // Social profiles (1000 points each)
  points += (profile.socialProfiles?.length || 0) * 1000;
  
  return points;
}
