"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";

export default function SessionResetDialog({ 
  isOpen, 
  onClose,
  onReset
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onReset: () => void;
}) {
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset() {
    setIsResetting(true);
    
    try {
      // Clear only session-related localStorage items
      const keysToRemove = [
        'eva_mirror_v1:currentSession',
        'eva_mirror_v1:tempAnswers',
        'eva_mirror_v1:sessionDraft',
        'eva_mirror_v1:lastQuestion',
        'ogPopupShown', // Reset OG popup flag so they can see it again
        'sessionStartTime'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove ${key}:`, e);
        }
      });
      
      // Clear any session storage as well
      sessionStorage.clear();
      
      // Important: Keep these items intact
      // - Twitter auth (eva_mirror_v1:twitter_auth)
      // - User profile cache (eva_unified_profile_cache)
      // - Any other essential data
      
      console.log('[SessionReset] Cleared session data, keeping auth and profile intact');
      
      // Trigger callback
      onReset();
      
      // Close dialog
      onClose();
      
      // Reload to fresh state
      setTimeout(() => {
        window.location.href = '/mirror'; // Redirect to mirror page for fresh start
      }, 500);
    } catch (error) {
      console.error('[SessionReset] Error:', error);
      alert('Failed to reset session. Please try again.');
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Start Fresh Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will clear your current session and allow you to start a new conversation with Eva.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Your data is safe!</strong> This only clears the current session:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>✓ Your points remain intact</li>
              <li>✓ Your profile is preserved</li>
              <li>✓ Your session history is saved</li>
              <li>✓ Your Twitter authentication stays active</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> If you're in the middle of a session, those answers will be lost. 
              Make sure to complete your current session first if you want to save it.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReset} 
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Fresh
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
