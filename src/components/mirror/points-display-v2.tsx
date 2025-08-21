"use client";

import React from "react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { Coins } from "lucide-react";

export default function PointsDisplayV2() {
  const { points, isOG, loading } = useUnifiedProfile();
  
  if (loading || points === 0) return null;
  
  return (
    <div className="fixed bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border p-3 shadow-sm z-40">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-red-900" />
        <div className="text-sm">
          <div className="font-medium">{points.toLocaleString()} pts</div>
          {isOG && (
            <div className="text-xs text-red-900">OG Member</div>
          )}
        </div>
      </div>
    </div>
  );
}
