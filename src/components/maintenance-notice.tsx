"use client";

import React from "react";
import { motion } from "framer-motion";
import { Construction, Sparkles, Zap, Shield, Database, Brain } from "lucide-react";

export default function MaintenanceNotice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-8 text-white text-center">
          <Construction className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold mb-2">Eva's Mirror is Evolving</h1>
          <p className="text-pink-100">Major upgrades in progress</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700">
              We're implementing groundbreaking improvements to enhance your experience with Eva.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Expected completion: Coming Soon
            </p>
          </div>

          {/* Upgrade Features */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What's Being Upgraded:</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <UpgradeItem
                icon={<Database className="h-5 w-5" />}
                title="Unified Storage System"
                description="Seamless point tracking across all devices with zero data loss"
              />
              
              <UpgradeItem
                icon={<Sparkles className="h-5 w-5" />}
                title="Enhanced OG Recognition"
                description="Automatic verification and one-time bonus application for original members"
              />
              
              <UpgradeItem
                icon={<Brain className="h-5 w-5" />}
                title="Smarter Eva Interactions"
                description="More personalized conversations with improved memory and context"
              />
              
              <UpgradeItem
                icon={<Zap className="h-5 w-5" />}
                title="Real-time Point Updates"
                description="Instant point calculations and live leaderboard updates"
              />
              
              <UpgradeItem
                icon={<Shield className="h-5 w-5" />}
                title="Session Recovery System"
                description="Never lose progress with automatic session backup and restoration"
              />
              
              <UpgradeItem
                icon={<Construction className="h-5 w-5" />}
                title="Unified Experience"
                description="Mirror and Profile merged into one seamless interface"
              />
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 text-center">
            <p className="text-lg font-medium text-gray-800 mb-2">
              Your points and progress are safe!
            </p>
            <p className="text-sm text-gray-600">
              All user data is preserved and will be automatically migrated when we relaunch.
            </p>
          </div>

          {/* Stay Updated */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Follow <span className="font-semibold text-pink-600">@EvaOnlineXYZ</span> for updates
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function UpgradeItem({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="text-pink-600 mt-1">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </motion.div>
  );
}
