"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";
import { loadProfile, calculateTotalPoints, saveProfile } from "@/lib/mirror/profile";
import { Calculator, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import Navbar from "@/components/navbar";
import { syncCompleteProfile, fixLocalProfilePoints } from "@/lib/supabase/sync-profile";

export default function DebugPointsPage() {
  const { auth, loading } = useTwitterAuth();
  const [profile, setProfile] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (auth) {
      loadDebugInfo();
    }
  }, [auth]);

  const loadDebugInfo = () => {
    const userProfile = loadProfile();
    setProfile(userProfile);

    if (userProfile) {
      // Calculate different point breakdowns
      let basePoints = 0;
      
      // Twitter verification
      if (userProfile.twitterVerified) basePoints += 1000;
      
      // Personal info
      const personalFields = [
        userProfile.personalInfo?.fullName,
        userProfile.personalInfo?.location,
        userProfile.personalInfo?.bio
      ];
      const filledFields = personalFields.filter(f => f && f.trim().length > 0).length;
      basePoints += filledFields * 333;
      
      // Social profiles
      basePoints += (userProfile.socialProfiles?.length || 0) * 1000;
      
      // Session points
      const sessionPoints = userProfile.sessionHistory?.reduce((sum, session) => {
        return sum + (session.pointsEarned || 0);
      }, 0) || 0;

      // OG bonus
      const ogBonus = (userProfile.isOG || userProfile.ogPointsAwarded) ? 10000 : 0;

      setDebugInfo({
        basePointsBreakdown: {
          twitter: userProfile.twitterVerified ? 1000 : 0,
          personalInfo: filledFields * 333,
          socialProfiles: (userProfile.socialProfiles?.length || 0) * 1000,
          total: basePoints
        },
        ogBonus,
        sessionPoints,
        calculatedTotal: calculateTotalPoints(userProfile),
        storedPoints: userProfile.points,
        expectedBasePoints: basePoints + ogBonus,
        hasCorruption: userProfile.points !== (basePoints + ogBonus)
      });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    
    try {
      const result = await syncCompleteProfile();
      if (result.success) {
        setMessage(`✅ Successfully synced! Total points: ${result.syncedData.totalPoints}`);
        loadDebugInfo();
      } else {
        setMessage(`❌ Sync failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleFix = async () => {
    setFixing(true);
    setMessage("");
    
    try {
      const result = await fixLocalProfilePoints();
      setMessage(`✅ Fixed local points! Old: ${result.oldPoints}, New: ${result.newPoints}, Total: ${result.totalPoints}`);
      loadDebugInfo();
      
      // Auto-sync after fix
      await handleSync();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

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
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-gray-600">Please log in to debug points.</p>
          <a
            href="/mirror"
            className="inline-block px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Go to Mirror
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900">
      <Navbar inverse />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-2">Points Debug Tool</h1>
          <p className="text-gray-600 mb-8">
            Analyze and fix point calculation issues
          </p>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {message.startsWith('✅') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message}
            </motion.div>
          )}

          {profile && debugInfo && (
            <div className="space-y-6">
              {/* Points Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Points Breakdown
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Base Points Breakdown:</h3>
                      <ul className="space-y-1 text-sm">
                        <li>Twitter Verification: {debugInfo.basePointsBreakdown.twitter}</li>
                        <li>Personal Info: {debugInfo.basePointsBreakdown.personalInfo}</li>
                        <li>Social Profiles: {debugInfo.basePointsBreakdown.socialProfiles}</li>
                        <li className="font-medium pt-1 border-t">
                          Subtotal: {debugInfo.basePointsBreakdown.total}
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Additional Points:</h3>
                      <ul className="space-y-1 text-sm">
                        <li>OG Bonus: {debugInfo.ogBonus}</li>
                        <li>Session Points: {debugInfo.sessionPoints}</li>
                        <li>Sessions: {profile.sessionHistory?.length || 0}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Expected Base (no sessions):</span>
                      <span>{debugInfo.expectedBasePoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Stored profile.points:</span>
                      <span className={debugInfo.hasCorruption ? 'text-red-600' : 'text-green-600'}>
                        {debugInfo.storedPoints}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Calculated Total:</span>
                      <span className="text-pink-600">{debugInfo.calculatedTotal}</span>
                    </div>
                  </div>
                  
                  {debugInfo.hasCorruption && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Points corruption detected! profile.points should be {debugInfo.expectedBasePoints} but is {debugInfo.storedPoints}.
                        This happens when session points are incorrectly added to the base points.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Data */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Profile Data</h2>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify({
                    twitterHandle: profile.twitterHandle,
                    isOG: profile.isOG,
                    ogPointsAwarded: profile.ogPointsAwarded,
                    points: profile.points,
                    humanScore: profile.humanScore,
                    totalQuestionsAnswered: profile.totalQuestionsAnswered,
                    sessionCount: profile.sessionHistory?.length || 0
                  }, null, 2)}
                </pre>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <div className="flex gap-4">
                  <button
                    onClick={handleFix}
                    disabled={fixing || !debugInfo.hasCorruption}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fixing ? 'Fixing...' : 'Fix Local Points'}
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {syncing ? 'Syncing...' : 'Sync to Supabase'}
                  </button>
                  <button
                    onClick={loadDebugInfo}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/profile"
              className="text-pink-600 hover:text-pink-700 transition-colors"
            >
              ← Back to Profile
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
