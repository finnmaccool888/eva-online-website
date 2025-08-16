"use client";

import React from "react";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import ProfileDashboard from "@/components/profile/profile-dashboard";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { auth, loading } = useTwitterAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-gray-600">
            Please log in with Twitter to view your profile.
          </p>
          <a
            href="/mirror"
            className="inline-block px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Go to Mirror
          </a>
        </motion.div>
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