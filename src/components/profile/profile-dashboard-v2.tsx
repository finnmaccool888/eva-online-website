"use client";

import React, { useEffect, useState } from "react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import ProfileHeader from "./profile-header";
import StatsCards from "./stats-cards";
import PointsBreakdown from "./points-breakdown";
import SessionHistory from "./session-history";
import LeaderboardWidget from "./leaderboard-widget";
import ScoringExplanation from "./scoring-explanation";
import ScoreComparison from "./score-comparison";
import MigrationNotice from "@/components/migration-notice";
import OGRecoveryDialog from "@/components/og-recovery-dialog";
import { Loader2, Sparkles } from "lucide-react";

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
  
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Migration Notice */}
      <MigrationNotice />
      
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          auth={auth}
          profile={profile}
        />

        {/* Points Breakdown */}
        <PointsBreakdown
          profile={profile}
        />

        {/* Stats Cards */}
        <StatsCards
          profile={profile}
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
      
      {/* Recovery Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowRecoveryDialog(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Check Points & OG Status
        </button>
      </div>

      {/* Recovery Dialog */}
      <OGRecoveryDialog 
        isOpen={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
      />
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
