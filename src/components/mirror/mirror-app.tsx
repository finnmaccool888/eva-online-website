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
import PasswordGate from "@/components/mirror/password-gate";
import { readJson, writeJson, StorageKeys } from "@/lib/mirror/storage";
import { loadProfile } from "@/lib/mirror/profile";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import { setTwitterAuth } from "@/lib/mirror/auth";
import { isOG } from "@/lib/mirror/og-verification";
import { checkSessionLimit } from "@/lib/mirror/session-limits";
import SessionLimitReached from "@/components/mirror/session-limit-reached";

export default function MirrorApp() {
  const [showWizard, setShowWizard] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOGPopup, setShowOGPopup] = useState(false);
  const [ogPopupShown, setOgPopupShown] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showSessionLimit, setShowSessionLimit] = useState(false);
  const [sessionLimitStatus, setSessionLimitStatus] = useState<ReturnType<typeof checkSessionLimit> | null>(null);
  const { auth, loading } = useTwitterAuth();
  
  const state = {
    authLoading: loading,
    hasHookAuth: !!auth,
    hasLocalAuth: typeof window !== 'undefined' ? !!localStorage.getItem('twitter_auth') : false,
    hasAuth: !!auth,
    isInitialized,
    passwordVerified,
    authError
  };
  
  console.log('[MirrorApp] Render state:', state);
  
  // Check if OG popup was already shown
  useEffect(() => {
    const shown = localStorage.getItem('ogPopupShown') === 'true';
    setOgPopupShown(shown);
  }, []);

  // Check if password has been verified in this session
  useEffect(() => {
    const verified = sessionStorage.getItem('mirrorPasswordVerified') === 'true';
    setPasswordVerified(verified);
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
    console.log('[MirrorApp] Main effect running:', {
      loading,
      hasAuth: !!auth,
      isRedirecting,
      isInitialized,
      passwordVerified,
      authError
    });
    
    // Still loading auth
    if (loading) {
      console.log('[MirrorApp] Still loading auth, waiting...');
      return;
    }
    
    // Check if we're already in the process of redirecting (stored in sessionStorage)
    const redirectInProgress = sessionStorage.getItem('mirrorAuthRedirecting') === 'true';
    if (redirectInProgress || isRedirecting) {
      console.log('[MirrorApp] Already redirecting, preventing duplicate redirect');
      return;
    }
    
    // No auth - redirect to Twitter OAuth
    if (!auth && !authError) {
      console.log('[MirrorApp] No auth found, redirecting to Twitter OAuth');
      setIsRedirecting(true);
      sessionStorage.setItem('mirrorAuthRedirecting', 'true');
      
      // Small delay to prevent immediate redirect on initial load
      setTimeout(() => {
        // Clear the redirect flag after a reasonable timeout
        setTimeout(() => {
          sessionStorage.removeItem('mirrorAuthRedirecting');
        }, 5000);
        window.location.href = '/api/auth/twitter';
      }, 500); // Increased delay to ensure proper state management
      return;
    }
    
    // Have auth - initialize the app if not already initialized
    if (auth && !isInitialized) {
      console.log('[MirrorApp] Auth found, initializing app. Password verified:', passwordVerified);
      // Clear any redirect flags since we have auth
      sessionStorage.removeItem('mirrorAuthRedirecting');
      
      // Initialize regardless of password verification status
      setIsInitialized(true);
      
      // Only proceed with full initialization if password is verified
      if (!passwordVerified) {
        console.log('[MirrorApp] Password not verified yet, will show password gate');
        return;
      }
      console.log('[MirrorApp] Proceeding with full initialization');
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
        // Create default profile - always check OG status from source of truth
        const verifiedOG = isOG(auth.twitterHandle);
        
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
          points: verifiedOG ? 11000 : 1000, // 1000 base + 10000 OG bonus
          trustScore: 20,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isOG: verifiedOG,
          ogPointsAwarded: verifiedOG,
        };
        writeJson(StorageKeys.userProfile, newProfile);
        
        // Update auth isOG if different
        if (auth.isOG !== verifiedOG) {
          auth.isOG = verifiedOG;
          setTwitterAuth(auth);
        }
      } else {
        // Check if existing profile needs OG points - verify from source of truth
        const verifiedOG = isOG(auth.twitterHandle);
        
        if (verifiedOG && (!profile.ogPointsAwarded || profile.points < 11000)) {
          // Calculate session points to preserve them
          let sessionPoints = 0;
          if (profile.sessionHistory && Array.isArray(profile.sessionHistory)) {
            sessionPoints = profile.sessionHistory.reduce((sum: number, session: any) => {
              return sum + (session.pointsEarned || 0);
            }, 0);
          }
          
          profile.points = 11000 + sessionPoints; // Base + OG + sessions
          profile.isOG = true;
          profile.ogPointsAwarded = true;
          profile.updatedAt = Date.now();
          writeJson(StorageKeys.userProfile, profile);
          console.log('[MirrorApp] Enforced OG points for existing profile');
        }
        
        // Update auth isOG if different
        if (auth.isOG !== verifiedOG) {
          auth.isOG = verifiedOG;
          setTwitterAuth(auth);
        }
      }
      
      setOnboarded(hasOnboarded || false);
      setIsInitialized(true);
      
      // Show OG popup if user is OG and hasn't seen it
      if (auth.isOG && !ogPopupShown) {
        console.log('[MirrorApp] Showing OG popup');
        setShowOGPopup(true);
        localStorage.setItem('ogPopupShown', 'true');
        setOgPopupShown(true);
      }
    }
    
    // If we have an auth error, still initialize to show the error state
    if (authError && !isInitialized) {
      console.log('[MirrorApp] Auth error present, initializing to show error');
      setIsInitialized(true);
    }
  }, [loading, auth, isInitialized, ogPopupShown, passwordVerified, authError, isRedirecting]);
  
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
  
  // Check session limits before showing Eva transmission
  useEffect(() => {
    if (onboarded && !showWizard && passwordVerified && auth) {
      const profile = loadProfile();
      const limitStatus = checkSessionLimit(profile);
      setSessionLimitStatus(limitStatus);
      
      if (!limitStatus.canStartSession) {
        setShowSessionLimit(true);
      }
    }
  }, [onboarded, showWizard, passwordVerified, auth]);

  function handleOGPopupClose() {
    setShowOGPopup(false);
  }

  function handlePasswordSuccess() {
    sessionStorage.setItem('mirrorPasswordVerified', 'true');
    setPasswordVerified(true);
  }

  function handleProfileRedirect() {
    window.location.href = '/profile';
  }
  
  // Show loading only while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600 animate-pulse">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }
  
  // Show error if no auth after loading
  if (!loading && !auth) {
    // Use authError state or check URL params
    const error = authError || new URLSearchParams(window.location.search).get('error');
    
    if (error) {
      // Clear the error from URL
      const cleanUrl = window.location.pathname;
      
      const details = new URLSearchParams(window.location.search).get('details');
      
      const errorMessages: Record<string, string> = {
        'invalid_state': 'Session expired. Please try logging in again.',
        'access_denied': 'Twitter authorization was denied.',
        'token_failed': 'Failed to complete authentication. Please try again.',
        'config_error': 'Authentication is not properly configured. Please check Twitter app settings.',
        'auth_failed': 'Authentication failed. Please try again.',
        'invalid_request': 'Invalid OAuth request. Check your Twitter app configuration.',
        'invalid_client': 'Invalid Client ID or Secret. Check your environment variables.',
        'missing_params': 'Missing required parameters from Twitter.',
        'callback_failed': 'Authentication callback failed. Check server logs.',
        'network_error': 'Network error during authentication. Please try again.',
        'token_error': 'Failed to exchange authorization code for token.',
        'user_fetch_error': 'Failed to fetch user information from Twitter.'
      };
      
      const errorMessage = errorMessages[error] || `Authentication error: ${error}`;
      const fullErrorMessage = details ? `${errorMessage} (${details})` : errorMessage;
      
      return (
        <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-red-500">Authentication Failed</p>
              <p className="text-sm text-gray-600">{fullErrorMessage}</p>
            </div>
            <button 
              onClick={() => {
                // Clear the error from URL and try again
                window.history.replaceState({}, '', cleanUrl);
                window.location.href = '/api/auth/twitter';
              }}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-md text-white text-sm font-medium transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    // Show redirecting message if we're in the process of redirecting
    if (isRedirecting) {
      return (
        <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-600">Redirecting to Twitter for authentication...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-pink-50 text-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
    // Show password gate if authenticated but not verified
  if (auth && !passwordVerified) {
    console.log('[MirrorApp] Showing password gate for authenticated user');
    return (
      <PasswordGate 
        isOG={auth.isOG || false} 
        onSuccess={handlePasswordSuccess}
        onProfileRedirect={handleProfileRedirect}
      />
    );
  }

  // Only allow OG members to proceed past this point
  if (auth && passwordVerified && !auth.isOG) {
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
        
        {auth && <AuthStatus />}
        {auth && isInitialized && <PointsDisplay />}
        
        {showWizard ? (
          <OnboardingWizard onComplete={handleWizardComplete} />
        ) : !onboarded ? (
          <Onboarding onDone={handleOnboardingDone} />
        ) : showSessionLimit && sessionLimitStatus ? (
          <SessionLimitReached 
            limitStatus={sessionLimitStatus} 
            onBack={() => setShowSessionLimit(false)}
          />
        ) : (
          <EvaTransmission onComplete={() => {
            // Re-check session limits after completing a session
            const profile = loadProfile();
            const limitStatus = checkSessionLimit(profile);
            setSessionLimitStatus(limitStatus);
            if (!limitStatus.canStartSession) {
              setShowSessionLimit(true);
            }
          }} />
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