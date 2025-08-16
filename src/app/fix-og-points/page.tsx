"use client";

import { useState, useEffect } from "react";
import { getTwitterAuth } from "@/lib/mirror/auth";
import { loadProfile, saveProfile, calculateTotalPoints } from "@/lib/mirror/profile";
import { supabase } from "@/lib/supabase/client";
import PrimaryButton from "@/components/primary-button";

export default function FixOGPointsPage() {
  const [auth, setAuth] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [supabasePoints, setSupabasePoints] = useState<number | null>(null);
  const [fixing, setFixing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const authData = getTwitterAuth();
    setAuth(authData);
    
    const profileData = loadProfile();
    setProfile(profileData);

    if (authData?.twitterHandle) {
      // Load Supabase data
      const { data: user } = await supabase
        .from('users')
        .select('*, user_profiles(*)')
        .eq('twitter_handle', authData.twitterHandle)
        .single();
      
      if (user?.user_profiles) {
        setSupabasePoints(user.user_profiles.points || 0);
      }
    }
  };

  const handleFixOGPoints = async () => {
    if (!auth?.twitterHandle || !auth?.isOG) {
      setMessage("You need to be authenticated as an OG member");
      return;
    }

    setFixing(true);
    setMessage("Fixing your OG points...");
    
    try {
      // Step 1: Fix local profile
      const currentProfile = loadProfile();
      
      // Calculate what the points should be
      let basePoints = 1000; // Starting points
      let ogBonus = 10000; // OG bonus
      let sessionPoints = 0;
      
      if (currentProfile.sessionHistory && Array.isArray(currentProfile.sessionHistory)) {
        sessionPoints = currentProfile.sessionHistory.reduce((sum: number, session: any) => {
          return sum + (session.pointsEarned || 0);
        }, 0);
      }
      
      const correctTotalPoints = basePoints + ogBonus + sessionPoints;
      
      // Update local profile
      currentProfile.points = basePoints + ogBonus; // Base + OG bonus only
      currentProfile.isOG = true;
      currentProfile.ogPointsAwarded = true;
      saveProfile(currentProfile);
      
      setMessage(`Local profile updated. Total points should be: ${correctTotalPoints} (${basePoints} base + ${ogBonus} OG + ${sessionPoints} sessions)`);
      
      // Step 2: Update Supabase
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('twitter_handle', auth.twitterHandle)
        .single();
        
      if (user) {
        await supabase
          .from('user_profiles')
          .update({
            points: basePoints + ogBonus + sessionPoints, // Total points in Supabase
            is_og_rewarded: true,
            human_score: currentProfile.humanScore || 0,
            total_questions_answered: currentProfile.totalQuestionsAnswered || 0,
            session_history: currentProfile.sessionHistory || []
          })
          .eq('user_id', user.id);
          
        // Also ensure user table has is_og = true
        await supabase
          .from('users')
          .update({ is_og: true })
          .eq('id', user.id);
      }
      
      // Step 3: Clear OG popup flag so you can see it again
      localStorage.removeItem('ogPopupShown');
      
      setMessage(`✅ Success! Your points have been fixed. Total: ${correctTotalPoints} points. Refresh your profile page to see the changes.`);
      
      // Reload data
      setTimeout(loadData, 1000);
      
    } catch (error) {
      setMessage("Error fixing OG points: " + error);
    } finally {
      setFixing(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-900 p-8">
        <h1 className="text-2xl font-bold mb-4">Fix OG Points</h1>
        <p className="text-gray-700">Please authenticate first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900 p-8">
      <h1 className="text-2xl font-bold mb-8">Fix OG Points</h1>
      
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Current Status</h2>
          
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <strong>Twitter Handle:</strong> @{auth.twitterHandle}
            </p>
            <p className="text-gray-700">
              <strong>OG Status:</strong>{" "}
              <span className={auth.isOG ? "text-green-600" : "text-red-600"}>
                {auth.isOG ? "✓ OG Member" : "✗ Not OG"}
              </span>
            </p>
            
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="font-semibold text-gray-900 mb-2">Points Breakdown:</p>
              
              <div className="space-y-1">
                <p className="text-gray-700">
                  <strong>Local Profile Points:</strong> {profile?.points || 0}
                </p>
                <p className="text-gray-700">
                  <strong>Session Points:</strong>{" "}
                  {profile?.sessionHistory?.reduce((sum: number, s: any) => sum + (s.pointsEarned || 0), 0) || 0}
                </p>
                <p className="text-gray-700">
                  <strong>Calculated Total:</strong>{" "}
                  {profile ? calculateTotalPoints(profile) : 0}
                </p>
                <p className="text-gray-700">
                  <strong>Supabase Points:</strong>{" "}
                  {supabasePoints !== null ? supabasePoints : "Loading..."}
                </p>
              </div>
              
              {auth.isOG && profile && profile.points < 10000 && (
                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ You're missing your 10,000 OG bonus points!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Fix OG Points</h2>
          
          <p className="text-gray-700 mb-4">
            This will:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
            <li>Award you the 10,000 OG bonus points</li>
            <li>Fix your local profile data</li>
            <li>Update your Supabase profile</li>
            <li>Clear the OG popup flag so you can see it again</li>
          </ul>
          
          <PrimaryButton
            onClick={handleFixOGPoints}
            disabled={fixing || !auth.isOG}
          >
            {fixing ? "Fixing..." : "Fix My OG Points"}
          </PrimaryButton>
          
          {!auth.isOG && (
            <p className="text-red-600 text-sm mt-2">
              You need to be an OG member to use this fix
            </p>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg border ${
            message.includes("Success") || message.includes("✅")
              ? "bg-green-50 border-green-200 text-green-800" 
              : message.includes("Error")
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
