"use client";

import React, { useState, useEffect } from "react";
import { loadProfile } from "@/lib/mirror/profile";
import { Coins } from "lucide-react";

export default function PointsDisplay() {
  const [profile, setProfile] = useState(loadProfile());
  
  useEffect(() => {
    // Refresh profile data every second to catch updates
    const interval = setInterval(() => {
      setProfile(loadProfile());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!profile) return null;
  
  return (
    <div className="fixed bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 shadow-sm z-40">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-red-900" />
        <div className="text-sm">
          <div className="font-medium">{profile.points.toLocaleString()} pts</div>
          {profile.isOG && (
            <div className="text-xs text-red-900">OG Member</div>
          )}
        </div>
      </div>
    </div>
  );
} 