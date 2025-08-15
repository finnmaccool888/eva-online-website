"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { logout } from "@/lib/mirror/auth";

interface AccessDeniedProps {
  username: string;
}

export default function AccessDenied({ username }: AccessDeniedProps) {
  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="inline-block"
        >
          <Lock className="h-20 w-20 text-red-900 mx-auto" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Access Restricted</h1>
          
          <p className="text-lg text-muted-foreground">
            Sorry @{username}, EVA's Mirror is currently in exclusive beta.
          </p>
          
          <div className="bg-red-900/20 rounded-lg p-4 border border-red-900/30">
            <p className="text-red-800">
              This experience is limited to OG community members during the initial phase.
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Stay tuned for public access announcements on our social channels.
          </p>
        </div>
        
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="text-xs text-muted-foreground pt-8">
          <p>Contact support if you believe this is an error.</p>
        </div>
      </motion.div>
    </div>
  );
} 