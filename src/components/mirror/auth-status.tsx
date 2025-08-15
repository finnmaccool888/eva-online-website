"use client";

import React from "react";
import { getTwitterAuth, logout } from "@/lib/mirror/auth";
import { LogOut } from "lucide-react";

export default function AuthStatus() {
  const auth = getTwitterAuth();
  
  if (!auth) return null;
  
  async function handleLogout() {
    console.log('[AuthStatus] Logout button clicked');
    if (confirm("This will log you out and clear all your data. Continue?")) {
      console.log('[AuthStatus] User confirmed logout');
      try {
        await logout();
        console.log('[AuthStatus] Logout completed');
      } catch (error) {
        console.error('[AuthStatus] Logout failed:', error);
      }
    }
  }
  
  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50">
      <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card/95 backdrop-blur-sm p-2 sm:p-3 text-card-foreground shadow-sm">
        {auth.profileImage && (
          <img 
            src={auth.profileImage} 
            alt={auth.twitterHandle}
            className="h-6 w-6 sm:h-8 sm:w-8 rounded-full"
          />
        )}
        <div className="text-xs sm:text-sm">
          <div className="font-medium">{auth.twitterHandle}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Verified {new Date(auth.verifiedAt).toLocaleDateString()}</div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          title="Logout"
          type="button"
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4 pointer-events-none" />
        </button>
      </div>
    </div>
  );
} 