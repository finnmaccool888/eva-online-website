"use client";

import React, { useEffect, useState, useRef } from "react";
import EvaTransmission from "@/components/mirror/eva-transmission";
import { track } from "@/lib/mirror/analytics";
import Onboarding from "@/components/mirror/onboarding";
import OnboardingWizard from "@/components/mirror/onboarding-wizard";
import ResetControls from "@/components/mirror/reset-controls";
import AuthStatus from "@/components/mirror/auth-status";
import OGPopup from "@/components/mirror/og-popup";
import PointsDisplay from "@/components/mirror/points-display";
import AccessDenied from "@/components/mirror/access-denied";
import { readJson, writeJson, StorageKeys } from "@/lib/mirror/storage";
import { loadProfile } from "@/lib/mirror/profile";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";

export default function MirrorApp() {
  const [showWizard, setShowWizard] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOGPopup, setShowOGPopup] = useState(false);
  const [ogPopupShown, setOgPopupShown] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { auth, loading } = useTwitterAuth();
  const redirectingRef = useRef(false);
  
  const state = {
    authLoading: loading,
    hasHookAuth: !!auth,
    hasLocalAuth: typeof window !== 'undefined' ? !!localStorage.getItem('twitter_auth') : false,
    hasAuth: !!auth,
    isInitialized
  };
  
  console.log('[MirrorApp] State:', state);
  
  // Check if OG popup was already shown
  useEffect(() => {
    const shown = localStorage.getItem('ogPopupShown') === 'true';
    setOgPopupShown(shown);
  }, []);
  
  // Handle URL errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      console.log('[MirrorApp] Auth error:', error);
      setAuthError(error);
      
      // Clear URL parameters after reading them
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Clear any stale OAuth cookies if we have an invalid_state error
      if (error === 'invalid_state') {
        console.log('[MirrorApp] Clearing stale OAuth cookies');
        // Clear client-side OAuth cookies
        document.cookie = 'twitter_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'code_verifier=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Also clear any stale auth cookies
        document.cookie = 'twitter_auth_client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('eva_mirror_v1:twitter_auth');
      }
    }
  }, []);
  
  useEffect(() => {
    console.log('[MirrorApp] Effect running, loading:', loading, 'auth:', !!auth, 'redirecting:', redirectingRef.current);
    
    // Still loading auth
    if (loading) {
      return;
    }
    
    // No auth and not already redirecting
    if (!auth && !redirectingRef.current) {
      // Check if we're coming back from an error
      const urlParams = new URLSearchParams(window.location.search);
      const hasError = urlParams.get('error');
      
      if (hasError) {
        console.log('[MirrorApp] Auth error detected, not redirecting');
        return;
      }
      
      console.log('[MirrorApp] No auth, redirecting to Twitter');
      redirectingRef.current = true;
      
      // Small delay to ensure any pending auth checks complete
      setTimeout(() => {
        window.location.href = '/api/auth/twitter';
      }, 100);
      return;
    }
    
    // Have auth, initialize app if not already done
    if (auth && !isInitialized) {
      console.log('[MirrorApp] Initializing app with auth:', auth);
      track("daily_opened");
      
      const profile = loadProfile();
      const hasOnboarded = readJson<boolean>(StorageKeys.onboarded, false);
      
      // Check if profile has been fully filled out
      const hasPersonalInfo = profile && 
        profile.personalInfo && 
        profile.personalInfo.fullName && 
        profile.personalInfo.location && 
        profile.personalInfo.bio;
      
      if (!profile) {
        // Create default profile
        const newProfile = {
          twitterId: auth.twitterId,
          twitterHandle: auth.twitterHandle,
          twitterName: auth.twitterName || "",
          twitterVerified: true,
          personalInfo: {
            fullName: "",
            location: "",
            bio: "",
          },
          socialProfiles: [],
          points: auth.isOG ? 11000 : 1000, // 1000 base + 10000 OG bonus
          trustScore: 20,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isOG: auth.isOG || false,
          ogPointsAwarded: auth.isOG || false,
        };
        writeJson(StorageKeys.userProfile, newProfile);
      } else {
        // Check if existing profile needs OG points
        if (auth.isOG && !profile.ogPointsAwarded) {
          profile.points = (profile.points || 0) + 10000;
          profile.isOG = true;
          profile.ogPointsAwarded = true;
          profile.updatedAt = Date.now();
          writeJson(StorageKeys.userProfile, profile);
          console.log('[MirrorApp] Added OG points to existing profile');
        }
      }
      
      // Check if user is OG and hasn't seen the popup yet
      if (auth.ogPointsAwarded && !ogPopupShown) {
        setShowOGPopup(true);
        setOgPopupShown(true);
        // Save that we've shown the OG popup
        localStorage.setItem('ogPopupShown', 'true');
      }
      
      // Show wizard if user hasn't filled personal info yet
      setShowWizard(!hasPersonalInfo);
      setOnboarded(hasOnboarded);
      setIsInitialized(true);
    }
  }, [loading, auth, isInitialized]);
  
  function handleWizardComplete() {
    setShowWizard(false);
    // After wizard, check if user has done the soul seed onboarding
    const hasOnboarded = readJson<boolean>(StorageKeys.onboarded, false);
    setOnboarded(hasOnboarded);
    
    // If they haven't done the soul seed onboarding yet, they'll see it next
    if (!hasOnboarded) {
      console.log('[MirrorApp] Wizard complete, showing soul seed onboarding next');
    }
  }
  
  function handleOnboardingDone() {
    writeJson(StorageKeys.onboarded, true);
    setOnboarded(true);
  }

  function handleOGPopupClose() {
    setShowOGPopup(false);
  }
  
  // Check if user is OG - if not, deny access
  if (auth && !loading && !auth.isOG) {
    return <AccessDenied username={auth.twitterHandle} />;
  }
  
  // Show loading while checking auth or not initialized
  if (loading || (!isInitialized && auth)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm sm:text-base text-muted-foreground animate-pulse">
            {loading ? "Checking authentication..." : "Loading your digital soul..."}
          </p>
        </div>
      </div>
    );
  }
  
  // Show error if no auth after loading
  if (!loading && !auth) {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      // Clear the error from URL
      const cleanUrl = window.location.pathname;
      
      const errorMessages: Record<string, string> = {
        'invalid_state': 'Session expired. Please try logging in again.',
        'access_denied': 'Twitter authorization was denied.',
        'token_failed': 'Failed to complete authentication. Please try again.',
        'config_error': 'Authentication is not properly configured.',
        'auth_failed': 'Authentication failed. Please try again.'
      };
      
      const errorMessage = errorMessages[error] || `Authentication error: ${error}`;
      
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-red-500">Authentication Failed</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <button 
              onClick={() => {
                // Clear the error from URL and try again
                window.history.replaceState({}, '', cleanUrl);
                window.location.href = '/api/auth/twitter';
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm sm:text-base text-muted-foreground">Redirecting to Twitter...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 sm:py-8 md:py-12">
      <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Eva&apos;s Mirror</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Feed your digital soul. Shape your mirror.
          </p>
        </div>
        
        {auth && <AuthStatus />}
        {auth && isInitialized && <PointsDisplay />}
        
        {showWizard ? (
          <OnboardingWizard onComplete={handleWizardComplete} />
        ) : !onboarded ? (
          <Onboarding onDone={handleOnboardingDone} />
        ) : (
          <EvaTransmission />
        )}
        
        <ResetControls />
      </div>
      {showOGPopup && auth && (
        <OGPopup 
          isOpen={showOGPopup} 
          onClose={handleOGPopupClose} 
          username={auth.twitterHandle}
        />
      )}
    </div>
  );
} 