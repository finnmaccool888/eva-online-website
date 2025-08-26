"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { readJson, writeJson, StorageKeys } from "@/lib/mirror/storage";
import { checkSessionLimit } from "@/lib/mirror/session-limits";
import { track } from "@/lib/mirror/analytics";

// Mirror components
import OnboardingWizardV2 from "./onboarding-wizard-v2";
import OnboardingV2 from "./onboarding-v2";
import PasswordGate from "./password-gate";
import EvaTransmission from "./eva-transmission";
import AuthStatus from "./auth-status";
import PointsDisplayV2 from "./points-display-v2";
import OGPopup from "./og-popup";
import SessionLimitReached from "./session-limit-reached";

// Profile components
import ProfileDashboardV2 from "@/components/profile/profile-dashboard-v2";

// Shared components
import MigrationNotice from "@/components/migration-notice";
import OGRecoveryDialog from "@/components/og-recovery-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, User, MessageSquare, Sparkles } from "lucide-react";

type ViewType = "eva" | "profile";

export default function MirrorAppUnified() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading, error: authError, twitterHandle, isOG } = useTwitterAuth();
  const { 
    profile, 
    loading: profileLoading,
    error: profileError,
    isOG: profileIsOG,
    points,
    hasOnboarded,
    hasSoulSeedOnboarded,
    refreshProfile,
    markOnboarded,
    markSoulSeedOnboarded,
    updateProfile 
  } = useUnifiedProfile();

  // View state - check URL params
  const viewParam = searchParams.get('view') as ViewType;
  const [activeView, setActiveView] = useState<ViewType>(viewParam || 'eva');
  
  // Mirror-specific state
  const [showWizard, setShowWizard] = useState(false);
  const [showOGPopup, setShowOGPopup] = useState(false);
  const [showSessionLimit, setShowSessionLimit] = useState(false);
  const [sessionLimitStatus, setSessionLimitStatus] = useState<any>(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [soulSeedOnboarded, setSoulSeedOnboarded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  // Update URL when view changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeView === 'profile') {
      url.searchParams.set('view', 'profile');
    } else {
      url.searchParams.delete('view');
    }
    window.history.replaceState({}, '', url);
  }, [activeView]);

  // Check password verification status
  useEffect(() => {
    const verified = sessionStorage.getItem('mirrorPasswordVerified') === 'true';
    setPasswordVerified(verified);
    
    // Clear any redirect flags if we're authenticated
    if (isAuthenticated) {
      sessionStorage.removeItem('mirrorAuthRedirecting');
      sessionStorage.removeItem('profileAuthRedirecting');
    }
  }, [isAuthenticated]);

  // Initialize soul seed onboarding status
  useEffect(() => {
    if (profile) {
      setSoulSeedOnboarded(profile.hasSoulSeedOnboarded || false);
    }
  }, [profile]);

  // Check session limits
  useEffect(() => {
    if (profile && activeView === 'eva') {
      const limitStatus = checkSessionLimit(profile);
      if (limitStatus.limitReached) {
        setShowSessionLimit(true);
        setSessionLimitStatus(limitStatus);
      }
    }
  }, [profile, activeView]);

  // Show OG popup if applicable
  useEffect(() => {
    if (isInitialized && profile && profile.isOG && !localStorage.getItem('ogPopupShown')) {
      setShowOGPopup(true);
      localStorage.setItem('ogPopupShown', 'true');
    }
  }, [isInitialized, profile]);

  // Initialize after auth loads
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile && !isInitialized) {
      // Check if user needs to complete profile wizard
      if (!profile.hasOnboarded) {
        setShowWizard(true);
      }
      setIsInitialized(true);
    }
  }, [authLoading, isAuthenticated, profile, isInitialized]);

  // Handle wizard completion
  function handleWizardComplete() {
    setShowWizard(false);
    markOnboarded();
    track('profile:wizard_completed');
  }

  // Handle soul seed onboarding
  function handleSoulSeedOnboardingDone(alias: string, vibe: "ethereal" | "zen" | "cyber") {
    setSoulSeedOnboarded(true);
    markSoulSeedOnboarded(alias, vibe);
    track('eva:soul_seed_created', { alias, vibe });
  }

  // Handle view switching
  const switchView = useCallback((view: ViewType) => {
    setActiveView(view);
    track(`navigation:${view}_view`);
    
    // Refresh profile when switching to profile view to get latest points
    if (view === 'profile') {
      refreshProfile();
    }
  }, [refreshProfile]);

  // Auth redirect logic
  if (!passwordVerified) {
    return <PasswordGate onVerified={() => setPasswordVerified(true)} />;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-pink-600" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isRedirecting) {
      return (
        <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-600 animate-pulse">
              Redirecting to authentication...
            </p>
          </div>
        </div>
      );
    }

    setIsRedirecting(true);
    sessionStorage.setItem('mirrorAuthRedirecting', 'true');
    setTimeout(() => {
      window.location.href = '/api/auth/twitter';
    }, 500);
    return null;
  }

  return (
    <div className="min-h-screen bg-pink-50 text-black">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-pink-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* View Toggle */}
            <div className="flex bg-pink-100 rounded-lg p-1">
              <button
                onClick={() => switchView('eva')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeView === 'eva'
                    ? 'bg-white text-pink-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Eva
              </button>
              <button
                onClick={() => switchView('profile')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeView === 'profile'
                    ? 'bg-white text-pink-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Profile
              </button>
            </div>

            {/* Recovery Button */}
            <button
              onClick={() => setShowRecoveryDialog(true)}
              className="px-3 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Check Points
            </button>
          </div>
        </div>
      </div>

      {/* Always Visible Points Display */}
      <div className="fixed bottom-4 right-4 z-40">
        <PointsDisplayV2 />
      </div>

      {/* Main Content with Slide Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ x: activeView === 'eva' ? -300 : 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: activeView === 'eva' ? 300 : -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="min-h-[calc(100vh-64px)]"
        >
          {activeView === 'eva' ? (
            <div className="mx-auto max-w-lg py-12 px-4">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Eva's Mirror</h1>
                <p className="text-base text-gray-600">
                  Feed your digital soul. Shape your mirror.
                </p>
              </div>
              
              <AuthStatus />
              
              {showWizard ? (
                <OnboardingWizardV2 onComplete={handleWizardComplete} />
              ) : !soulSeedOnboarded ? (
                <OnboardingV2 onDone={handleSoulSeedOnboardingDone} />
              ) : showSessionLimit ? (
                <SessionLimitReached 
                  status={sessionLimitStatus}
                  onClose={() => setShowSessionLimit(false)}
                />
              ) : (
                <EvaTransmission onComplete={() => {
                  // Refresh profile after completing session to update points
                  setTimeout(() => {
                    refreshProfile();
                  }, 1000);
                }} />
              )}
            </div>
          ) : (
            <div className="min-h-[calc(100vh-64px)]">
              {/* Use the original ProfileDashboardV2 component */}
              {profile && (
                <ProfileDashboardV2 
                  auth={{
                    twitterId: profile.twitterId,
                    twitterHandle: profile.twitterHandle,
                    twitterName: profile.twitterHandle,
                    profileImage: "",
                    isOG: profile.isOG || false,
                  }}
                />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Popups and Dialogs */}
      <MigrationNotice />
      
      {showOGPopup && (
        <OGPopup 
          points={points || 11000}
          onClose={() => setShowOGPopup(false)}
        />
      )}
      
      <OGRecoveryDialog 
        isOpen={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
      />
    </div>
  );
}
