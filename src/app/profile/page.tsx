"use client";

import React, { useState, useEffect } from "react";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import ProfileDashboard from "@/components/profile/profile-dashboard";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { auth, loading } = useTwitterAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isAuthenticated = !!auth;

  // Clear any redirect flags when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.removeItem('profileAuthRedirecting');
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full mx-auto mb-2"
          />
          <p className="text-sm text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!auth && !isAuthenticated) {
    // Check if we're already redirecting
    const redirectInProgress = sessionStorage.getItem('profileAuthRedirecting') === 'true';
    if (redirectInProgress || isRedirecting) {
      return (
        <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-600 animate-pulse">
              Redirecting to authentication...
            </p>
          </div>
        </div>
      );
    }

    // Set redirect flags and redirect to auth
    setIsRedirecting(true);
    sessionStorage.setItem('profileAuthRedirecting', 'true');
    
    setTimeout(() => {
      // Clear flag after timeout
      setTimeout(() => {
        sessionStorage.removeItem('profileAuthRedirecting');
      }, 5000);
      window.location.href = '/api/auth/twitter';
    }, 500);

    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-gray-600">
            Redirecting to login...
          </p>
        </motion.div>
      </div>
    );
  }

  // At this point, auth should be defined (we checked above)
  if (!auth) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900">
      <ProfileDashboard auth={{
        twitterId: auth.twitterId,
        twitterHandle: auth.twitterHandle,
        twitterName: auth.twitterName || auth.twitterHandle,
        profileImage: auth.profileImage || "",
        isOG: auth.isOG || false,
      }} />
    </div>
  );
} 