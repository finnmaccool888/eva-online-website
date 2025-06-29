"use client";

import { useLeaderboard } from "@/lib/hooks/useLeaderboard";
import { formatNumber } from "@/lib/utils";

export default function Stats() {
  const { data: leaderboard, isLoading, error } = useLeaderboard();

  // Calculate stats from leaderboard data
  const stats = {
    totalYappers: leaderboard?.length || 0,
    topScore:
      leaderboard && leaderboard.length > 0
        ? Math.max(...leaderboard.map((entry) => entry.totalPoints))
        : 0,
    avgScore:
      leaderboard && leaderboard.length > 0
        ? Math.round(
            leaderboard.reduce((sum, entry) => sum + entry.totalPoints, 0) /
              leaderboard.length
          )
        : 0,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 lg:gap-16 text-[#48333D] w-full lg:w-1/3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 lg:gap-16 text-[#48333D] w-full lg:w-1/3">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">--</h1>
          <p>Total Yappers</p>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">--</h1>
          <p>Top Score</p>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">--</h1>
          <p>Avg. Score</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-16 text-[#48333D] w-full lg:w-1/3">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{stats.totalYappers}</h1>
        <p>Total Yappers</p>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{formatNumber(stats.topScore)}</h1>
        <p>Top Score</p>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{formatNumber(stats.avgScore)}</h1>
        <p>Avg. Score</p>
      </div>
    </div>
  );
}
