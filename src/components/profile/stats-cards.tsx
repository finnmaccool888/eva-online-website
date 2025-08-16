"use client";

import React from "react";
import { UserProfile } from "@/lib/mirror/types";
import { TrendingUp, Target, Calendar, Star } from "lucide-react";
import { calculateTotalPoints } from "@/lib/mirror/profile";

interface StatsCardsProps {
  profile: UserProfile;
}

export default function StatsCards({ profile }: StatsCardsProps) {
  const totalSessions = profile.sessionHistory?.length || 0;
  const averageScore = profile.humanScore || 0; // Use the calculated average from profile
  const totalQuestions = profile.totalQuestionsAnswered || 0; // Use total from profile
  
  // Use unified points calculation instead of stored points
  const actualPoints = calculateTotalPoints(profile);

  const stats = [
    {
      title: "Total Points",
      value: actualPoints.toLocaleString(),
      icon: Star,
      color: "text-blue-500",
      bgColor: "bg-white",
    },
    {
      title: "Human Score",
      value: `${averageScore}/100`,
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-white",
    },
    {
      title: "Sessions",
      value: totalSessions.toString(),
      icon: TrendingUp,
      color: "text-slate-600",
      bgColor: "bg-white",
    },
    {
      title: "Questions",
      value: totalQuestions.toString(),
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-white",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-xl shadow-sm border border-gray-200 p-6`}>
          <div className="flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 