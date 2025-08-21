"use client";

import React, { useState, useEffect } from "react";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { readJson, writeJson, StorageKeys } from "@/lib/mirror/storage";
import { checkSessionLimit } from "@/lib/mirror/session-limits";
import OnboardingWizard from "./onboarding-wizard";
import Onboarding from "./onboarding";
import PasswordGate from "./password-gate";
import EvaTransmission from "./eva-transmission";
import AuthStatus from "./auth-status";
import PointsDisplay from "./points-display";
import OGPopup from "./og-popup";
import SessionLimitReached from "./session-limit-reached";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/primary-button";
import { track } from "@/lib/mirror/analytics";

export default function MirrorAppV2() {
  const { isAuthenticated, loading: authLoading, error: authError, twitterHandle, isOG } = useTwitterAuth();
  const { 
    profile, 
    loading: profileLoading, 
    hasOnboarded,
    markOnboarded,
    updateProfile 
  } = useUnifiedProfile();
  
  const [showWizard, setShowWizard] = useState(false);
  const [showOGPopup, setShowOGPopup] = useState(false);
  const [showSessionLimit, setShowSessionLimit] = useState(false);
  const [sessionLimitStatus, setSessionLimitStatus] = useState<any>(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [soulSeedOnboarded, setSoulSeedOnboarded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check password verification status
  useEffect(() => {
    const verified = sessionStorage.getItem('mirrorPasswordVerified') === 'true';
    setPasswordVerified(verified);
  }, []);

  // Initialize once auth and profile are loaded
  useEffect(() => {
    if (!authLoading && !profileLoading && isAuthenticated && profile && !isInitialized) {
      console.log('[MirrorApp] Initializing with profile:', {
        hasOnboarded: profile.hasOnboarded,
        isOG: profile.isOG,
        points: profile.points
      });

      // Check if user needs to complete profile wizard
      const needsProfileWizard = !profile.personalInfo?.fullName || 
                                profile.socialProfiles.length === 0;
      
      if (needsProfileWizard && !profile.hasOnboarded) {
        setShowWizard(true);
      } else {
        // Check soul seed onboarding
        const soulSeedDone = readJson<boolean>(StorageKeys.onboarded, false);
        setSoulSeedOnboarded(soulSeedDone);
      }

      // Show OG popup if applicable
      if (isOG && !localStorage.getItem('ogPopupShown')) {
        setShowOGPopup(true);
        localStorage.setItem('ogPopupShown', 'true');
      }

      setIsInitialized(true);
    }
  }, [authLoading, profileLoading, isAuthenticated, profile, isInitialized, isOG]);

  // Check session limits when ready to show Eva transmission
  useEffect(() => {
    if (profile && hasOnboarded && soulSeedOnboarded && !showWizard && passwordVerified) {
      const limitStatus = checkSessionLimit(profile);
      setSessionLimitStatus(limitStatus);
      
      if (!limitStatus.canStartSession) {
        setShowSessionLimit(true);
      }
    }
  }, [profile, hasOnboarded, soulSeedOnboarded, showWizard, passwordVerified]);

  // Handle wizard completion
  async function handleWizardComplete(updatedProfile: any) {
    console.log('[MirrorApp] Profile wizard completed');
    setShowWizard(false);
    
    // Mark as onboarded in unified storage
    await markOnboarded();
    
    // Check if soul seed onboarding is done
    const soulSeedDone = readJson<boolean>(StorageKeys.onboarded, false);
    setSoulSeedOnboarded(soulSeedDone);
  }

  // Handle soul seed onboarding completion
  async function handleSoulSeedOnboardingDone() {
    console.log('[MirrorApp] Soul seed onboarding completed');
    writeJson(StorageKeys.onboarded, true);
    setSoulSeedOnboarded(true);
    
    // Track completion
    track("onboarding_complete");
  }

  function handlePasswordSuccess() {
    sessionStorage.setItem('mirrorPasswordVerified', 'true');
    setPasswordVerified(true);
  }

  function handleProfileRedirect() {
    window.location.href = '/profile';
  }

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600 animate-pulse">
            Loading Eva's Mirror...
          </p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError || !isAuthenticated) {
    const error = new URLSearchParams(window.location.search).get('error');
    const errorDetails = new URLSearchParams(window.location.search).get('error_description');
    
    if (error) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to your Twitter account. Please try again.',
        'invalid_request': 'Invalid OAuth request. Check your Twitter app configuration.',
        'invalid_client': 'Invalid Client ID or Secret. Check your environment variables.',
        'missing_params': 'Missing required parameters from Twitter.',
        'callback_failed': 'Authentication callback failed. Check server logs.',
        'network_error': 'Network error during authentication. Please try again.',
        'token_error': 'Failed to exchange authorization code for token.',
        'user_fetch_error': 'Failed to fetch user information from Twitter.'
      };
      
      const errorMessage = errorMessages[error] || `Authentication error: ${error}`;
      const fullErrorMessage = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;
      
      return (
        <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-red-500">Authentication Failed</p>
              <p className="text-sm text-gray-600">{fullErrorMessage}</p>
            </div>
            <button 
              onClick={() => window.location.href = '/api/auth/twitter'}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-md text-white text-sm font-medium transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Please authenticate to continue...
          </p>
        </div>
      </div>
    );
  }

  // Password gate
  if (!passwordVerified) {
    return (
      <PasswordGate 
        isOG={isOG} 
        onSuccess={handlePasswordSuccess}
        onProfileRedirect={handleProfileRedirect}
      />
    );
  }

  // OG-only access check
  if (!isOG) {
    return (
      <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Restricted</h2>
          <p className="text-gray-600">
            The Mirror module is currently in OG-only early access.
          </p>
          <button
            onClick={handleProfileRedirect}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg transition-colors text-white"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-black">
      <div className="mx-auto max-w-lg py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Eva's Mirror</h1>
          <p className="text-base text-gray-600">
            Feed your digital soul. Shape your mirror.
          </p>
        </div>
        
        <AuthStatus />
        <PointsDisplay />
        
        {showWizard ? (
          <OnboardingWizard onComplete={handleWizardComplete} />
        ) : !soulSeedOnboarded ? (
          <Onboarding onDone={handleSoulSeedOnboardingDone} />
        ) : showSessionLimit ? (
          <SessionLimitReached 
            status={sessionLimitStatus}
            onClose={() => setShowSessionLimit(false)}
          />
        ) : (
          <EvaTransmission />
        )}
      </div>

      {/* OG Popup */}
      {showOGPopup && (
        <OGPopup 
          points={profile?.points || 11000}
          onClose={() => setShowOGPopup(false)}
        />
      )}
    </div>
  );
}
