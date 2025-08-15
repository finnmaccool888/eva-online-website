import { readJson, writeJson, StorageKeys } from "./storage";
import { trackEvent as trackToSupabase } from "@/lib/supabase/services";
import { getTwitterAuth } from "./auth";

export type AnalyticEvent = {
  name:
    | "onboarding_started"
    | "onboarding_completed"
    | "onboarding_twitter_completed"
    | "onboarding_personal_completed"
    | "onboarding_socials_completed"
    | "onboarding_wizard_completed"
    | "daily_opened"
    | "daily_completed"
    | "prompt_answered"
    | "prompt_skipped"
    | "streak_day"
    | "reward_revealed"
    | "trait_unlocked"
    | "share_clicked"
    | "echo_invite_generated"
    | "echo_redeemed";
  ts: number;
  props?: Record<string, unknown>;
};

export function track(name: AnalyticEvent["name"], props?: Record<string, unknown>) {
  const q = readJson<AnalyticEvent[]>(StorageKeys.analyticsQueue, []);
  const evt: AnalyticEvent = { name, ts: Date.now(), props };
  q.push(evt);
  writeJson(StorageKeys.analyticsQueue, q);
  if (process.env.NODE_ENV !== "production") {
    console.log("analytics", evt);
  }
  
  // Also track to Supabase if authenticated
  try {
    const auth = getTwitterAuth();
    if (auth?.twitterHandle) {
      // Fire and forget - don't await
      trackToSupabase(null, name, props).catch(console.error);
    }
  } catch (error) {
    // Ignore errors - analytics shouldn't break the app
  }
} 