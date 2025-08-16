"use client";

import { useState, useEffect } from "react";
import { getTwitterAuth } from "@/lib/mirror/auth";
import { isOG } from "@/lib/mirror/og-verification";
import { enforceOGPoints, enforceOGPointsForAllUsers } from "@/lib/supabase/og-enforcement";
import { supabase } from "@/lib/supabase/client";
import PrimaryButton from "@/components/primary-button";

export default function OGEnforcementPage() {
  const [auth, setAuth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isOGVerified, setIsOGVerified] = useState<boolean | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const authData = getTwitterAuth();
    setAuth(authData);
    
    if (authData?.twitterHandle) {
      // Check OG status from source of truth
      const ogStatus = isOG(authData.twitterHandle);
      setIsOGVerified(ogStatus);
      
      // Check Supabase status
      const { data: user } = await supabase
        .from('users')
        .select('*, user_profiles(*)')
        .eq('twitter_handle', authData.twitterHandle)
        .single();
        
      if (user) {
        const profile = Array.isArray(user.user_profiles) 
          ? user.user_profiles[0] 
          : user.user_profiles;
          
        setSupabaseStatus({
          isOG: user.is_og,
          points: profile?.points || 0,
          isOGRewarded: profile?.is_og_rewarded || false,
          sessionCount: profile?.session_history?.length || 0
        });
      }
    }
  };

  const handleEnforceMyPoints = async () => {
    if (!auth?.twitterHandle) {
      setMessage("No authentication found");
      return;
    }

    setLoading(true);
    setMessage("Enforcing OG points...");
    
    try {
      const result = await enforceOGPoints(auth.twitterHandle);
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        // Refresh status
        await checkStatus();
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnforceAllUsers = async () => {
    if (!confirm("This will check and fix OG points for ALL users in the database. Continue?")) {
      return;
    }

    setLoading(true);
    setMessage("Processing all users...");
    
    try {
      const result = await enforceOGPointsForAllUsers();
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900 p-8">
      <h1 className="text-2xl font-bold mb-8">OG Points Enforcement System</h1>
      
      <div className="max-w-4xl space-y-6">
        {/* Current Status */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Current Status</h2>
          
          {auth ? (
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <strong>Twitter Handle:</strong> @{auth.twitterHandle}
              </p>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-semibold text-gray-900 mb-2">Source of Truth (ogList.json)</p>
                  <p className="text-gray-700">
                    <strong>OG Status:</strong>{" "}
                    <span className={isOGVerified ? "text-green-600" : "text-red-600"}>
                      {isOGVerified ? "✓ OG Member" : "✗ Not OG"}
                    </span>
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded">
                  <p className="font-semibold text-gray-900 mb-2">Supabase Status</p>
                  {supabaseStatus ? (
                    <div className="space-y-1">
                      <p className="text-gray-700">
                        <strong>is_og:</strong>{" "}
                        <span className={supabaseStatus.isOG ? "text-green-600" : "text-red-600"}>
                          {supabaseStatus.isOG ? "true" : "false"}
                        </span>
                      </p>
                      <p className="text-gray-700">
                        <strong>Points:</strong> {supabaseStatus.points.toLocaleString()}
                      </p>
                      <p className="text-gray-700">
                        <strong>OG Rewarded:</strong>{" "}
                        <span className={supabaseStatus.isOGRewarded ? "text-green-600" : "text-red-600"}>
                          {supabaseStatus.isOGRewarded ? "true" : "false"}
                        </span>
                      </p>
                      <p className="text-gray-700">
                        <strong>Sessions:</strong> {supabaseStatus.sessionCount}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No Supabase data</p>
                  )}
                </div>
              </div>
              
              {/* Status Analysis */}
              {isOGVerified !== null && supabaseStatus && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-semibold text-gray-900 mb-2">Status Analysis:</p>
                  {isOGVerified && !supabaseStatus.isOG && (
                    <p className="text-yellow-800">⚠️ User is OG but Supabase doesn't reflect this</p>
                  )}
                  {isOGVerified && supabaseStatus.points < 11000 && (
                    <p className="text-yellow-800">⚠️ User is OG but missing bonus points</p>
                  )}
                  {!isOGVerified && supabaseStatus.isOG && (
                    <p className="text-red-800">❌ User is marked as OG in Supabase but not in ogList.json</p>
                  )}
                  {isOGVerified && supabaseStatus.isOG && supabaseStatus.points >= 11000 && (
                    <p className="text-green-800">✅ Everything looks correct!</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-700">Not authenticated</p>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Actions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Enforce My OG Points</h3>
              <p className="text-gray-700 text-sm mb-3">
                This will check your OG status against the source of truth and ensure your points are correct in Supabase.
              </p>
              <PrimaryButton
                onClick={handleEnforceMyPoints}
                disabled={loading || !auth}
              >
                {loading ? "Processing..." : "Enforce My Points"}
              </PrimaryButton>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Enforce All Users (Admin)</h3>
              <p className="text-gray-700 text-sm mb-3">
                This will check and fix OG points for all users in the database. Use with caution.
              </p>
              <PrimaryButton
                onClick={handleEnforceAllUsers}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Processing..." : "Enforce All Users"}
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.includes("✅")
              ? "bg-green-50 border-green-200 text-green-800" 
              : message.includes("❌") || message.includes("Error")
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {message}
          </div>
        )}
        
        {/* How It Works */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">How OG Enforcement Works</h2>
          
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>The system checks if your Twitter handle is in the official OG list (ogList.json)</li>
            <li>If you're an OG member, it ensures you have at least 11,000 base points (1,000 + 10,000 OG bonus)</li>
            <li>Session points are added on top of this base amount</li>
            <li>The enforcement runs automatically when you:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Log in via Twitter OAuth</li>
                <li>Load your profile page</li>
                <li>Sync your profile data</li>
              </ul>
            </li>
            <li>This ensures OG members never lose their bonus points</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
