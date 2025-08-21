"use client";

import React from "react";
import { UserProfile } from "@/lib/mirror/types";
import { TrendingUp, Target, Calendar, Star } from "lucide-react";
import { calculateTotalPoints } from "@/lib/mirror/profile";

interface StatsCardsProps {
  profile: UserProfile;
}

export default function StatsCards({ profile }: StatsCardsProps) {
  // Add null check
  if (!profile) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-center text-gray-500">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

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
      color: "text-blue-700",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/50",
      borderColor: "border-blue-100/50",
    },
    {
      title: "Human Score",
      value: `${averageScore}/100`,
      icon: Target,
      color: "text-emerald-700",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
      borderColor: "border-emerald-100/50",
    },
    {
      title: "Sessions",
      value: totalSessions.toString(),
      icon: TrendingUp,
      color: "text-purple-700",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/50",
      borderColor: "border-purple-100/50",
    },
    {
      title: "Questions",
      value: totalQuestions.toString(),
      icon: Calendar,
      color: "text-amber-700",
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100/50",
      borderColor: "border-amber-100/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-xl shadow-lg border ${stat.borderColor} p-6 backdrop-blur-sm`}>
          <div className="flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className={`text-sm font-medium ${stat.color.replace('700', '600/80')}`}>{stat.title}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 