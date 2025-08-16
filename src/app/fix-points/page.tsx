"use client";

import { useState, useEffect } from "react";
import { getTwitterAuth } from "@/lib/mirror/auth";
import { loadProfile, calculateTotalPoints } from "@/lib/mirror/profile";
import { fixOGPoints, syncUserPoints } from "@/lib/supabase/fix-points";
import PrimaryButton from "@/components/primary-button";

export default function FixPointsPage() {
  const [auth, setAuth] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fixing, setFixing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const authData = getTwitterAuth();
    setAuth(authData);
    const profileData = loadProfile();
    setProfile(profileData);
  }, []);

  const handleFixOGPoints = async () => {
    setFixing(true);
    setMessage("Fixing OG points for all users...");
    
    try {
      await fixOGPoints();
      setMessage("OG points fix completed! Check your profile.");
    } catch (error) {
      setMessage("Error fixing OG points: " + error);
    } finally {
      setFixing(false);
    }
  };

  const handleSyncMyPoints = async () => {
    if (!auth?.twitterHandle) {
      setMessage("No Twitter authentication found");
      return;
    }

    setFixing(true);
    setMessage("Syncing your points to Supabase...");
    
    try {
      await syncUserPoints(auth.twitterHandle);
      setMessage("Points synced successfully! Refresh your profile page.");
    } catch (error) {
      setMessage("Error syncing points: " + error);
    } finally {
      setFixing(false);
    }
  };

  const totalPoints = profile ? calculateTotalPoints(profile) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Fix Points Utility</h1>
        
        {auth && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Current Status</h2>
            <div className="space-y-2">
              <p>Twitter: @{auth.twitterHandle}</p>
              <p>OG Status: {auth.isOG ? "✅ OG Member" : "❌ Not OG"}</p>
              <p>Profile Points: {profile?.points || 0}</p>
              <p>Session Points: {profile?.sessionHistory?.reduce((sum: number, s: any) => sum + (s.pointsEarned || 0), 0) || 0}</p>
              <p className="font-bold">Total Points (Calculated): {totalPoints}</p>
              {auth.isOG && totalPoints < 10000 && (
                <p className="text-red-600">⚠️ Missing OG bonus! You should have at least 10,000 points.</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Sync My Points</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will sync your localStorage points to Supabase, ensuring your total is correct.
            </p>
            <PrimaryButton 
              onClick={handleSyncMyPoints}
              disabled={fixing || !auth}
            >
              {fixing ? "Syncing..." : "Sync My Points"}
            </PrimaryButton>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Fix All OG Points (Admin)</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will check all OG users and ensure they have their 10,000 point bonus.
            </p>
            <PrimaryButton 
              onClick={handleFixOGPoints}
              disabled={fixing}
            >
              {fixing ? "Fixing..." : "Fix All OG Points"}
            </PrimaryButton>
          </div>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
            {message}
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/profile" className="text-blue-600 hover:text-blue-800">
            ← Back to Profile
          </a>
        </div>
      </div>
    </div>
  );
}
