"use client";

import React from "react";
import { wipeAllMirrorLocal } from "@/lib/mirror/storage";
import { logout } from "@/lib/mirror/auth";
import { LogOut, RefreshCw } from "lucide-react";

export default function ResetControls() {
  async function handleLogout() {
    const ok = confirm(
      "This will log you out of Twitter and clear all your Mirror data. Continue?"
    );
    if (!ok) return;
    localStorage.removeItem('ogPopupShown'); // Clear OG popup flag
    await logout();
  }
  
  function resetLocalData() {
    const ok = confirm(
      "This will delete your profile, Soul Seed, artifacts, and memories (but keep you logged in). Your data is private and stored only on this device. Proceed?"
    );
    if (!ok) return;
    localStorage.removeItem('ogPopupShown'); // Clear OG popup flag
    wipeAllMirrorLocal();
    location.reload();
  }
  
  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
      <button 
        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
        type="button" 
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Logout & Start Fresh
      </button>
      
      <button 
        className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100 transition-opacity"
        type="button" 
        onClick={resetLocalData}
      >
        <RefreshCw className="h-4 w-4" />
        Reset Local Data Only
      </button>
    </div>
  );
} 