"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrimaryButton from "@/components/primary-button";
import { OnboardingStep, UserProfile, SocialPlatform } from "@/lib/mirror/types";
import { loadProfile, saveProfile, addSocialProfile, calculatePoints, calculateTrustScore } from "@/lib/mirror/profile";
import { Mail, MessageCircle, Instagram, Linkedin, Youtube, Video } from "lucide-react";
import { track } from "@/lib/mirror/analytics";
import { getTwitterAuth } from "@/lib/mirror/auth";

const SOCIAL_CONFIGS: Array<{
  platform: SocialPlatform;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}> = [
  { platform: "email", label: "Email", placeholder: "your@email.com", icon: <Mail className="h-4 w-4" /> },
  { platform: "discord", label: "Discord", placeholder: "username#1234", icon: <MessageCircle className="h-4 w-4" /> },
  { platform: "instagram", label: "Instagram", placeholder: "@username", icon: <Instagram className="h-4 w-4" /> },
  { platform: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/username", icon: <Linkedin className="h-4 w-4" /> },
  { platform: "youtube", label: "YouTube", placeholder: "@channel", icon: <Youtube className="h-4 w-4" /> },
  { platform: "tiktok", label: "TikTok", placeholder: "@username", icon: <Video className="h-4 w-4" /> },
];

export default function OnboardingWizard({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const existingAuth = getTwitterAuth();
  const [step, setStep] = useState<OnboardingStep>("personal");
  const [profile, setProfile] = useState<UserProfile>(() => {
    const p = loadProfile();
    // If we have existing auth, apply it to profile
    if (existingAuth) {
      p.twitterId = existingAuth.twitterId;
      p.twitterHandle = existingAuth.twitterHandle;
      p.twitterVerified = true;
      p.points = Math.max(p.points, 1000);
      p.trustScore = Math.max(p.trustScore, 20);
    }
    return p;
  });
  const [formData, setFormData] = useState({
    twitterHandle: existingAuth?.twitterHandle || "",
    fullName: profile.personalInfo?.fullName || "",
    location: profile.personalInfo?.location || "",
    bio: profile.personalInfo?.bio || "",
    socials: {} as Record<SocialPlatform, string>,
  });

  const stepIndex = ["personal", "socials", "questions"].indexOf(step);
  const progressPct = Math.round(((stepIndex + 1) / 3) * 100);



  function handlePersonalStep() {
    const updated = { ...profile };
    updated.personalInfo = {
      fullName: formData.fullName,
      location: formData.location,
      bio: formData.bio,
    };
    updated.points = calculatePoints(updated);
    updated.trustScore = calculateTrustScore(updated);
    setProfile(updated);
    saveProfile(updated);
    track("onboarding_personal_completed");
    setStep("socials");
  }

  function handleSocialsStep() {
    let updated = { ...profile };
    
    // Add all provided social profiles
    Object.entries(formData.socials).forEach(([platform, handle]) => {
      if (handle && handle.trim()) {
        updated = addSocialProfile(updated, platform as SocialPlatform, handle);
      }
    });
    
    setProfile(updated);
    saveProfile(updated);
    track("onboarding_socials_completed", { count: updated.socialProfiles.length });
    setStep("questions");
  }

  function handleComplete() {
    track("onboarding_wizard_completed", { 
      points: profile.points,
      trustScore: profile.trustScore 
    });
    onComplete(profile);
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full rounded-lg border border-border bg-card p-6 shadow-lg text-card-foreground"
        >
          {/* Progress bar */}
          {step !== "complete" && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <div>Step {stepIndex + 1} of 3</div>
                <div>{profile.points.toLocaleString()} points</div>
              </div>
              <div className="h-2 w-full rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {profile.trustScore > 0 && (
                <div className="text-xs mt-1 text-muted-foreground">
                  Trust Score: {profile.trustScore}/100
                </div>
              )}
            </div>
          )}



          {/* Personal Info Step */}
          {step === "personal" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Optional, but adds trust and earns points
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm">Full Name</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm">Location</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground"
                    placeholder="New York, USA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm">Bio</label>
                  <textarea
                    className="mt-1 w-full min-h-20 rounded-md border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground"
                    placeholder="Tell us a bit about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setStep("socials")}
                >
                  Skip
                </button>
                <PrimaryButton onClick={handlePersonalStep} className="flex-1">
                  Continue
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Social Profiles Step */}
          {step === "socials" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Connect Your Socials</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  +1,000 points for each social profile added
                </p>
              </div>

              <div className="space-y-3">
                {SOCIAL_CONFIGS.map(({ platform, placeholder, icon }) => (
                  <div key={platform} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {icon}
                    </div>
                    <input
                      type="text"
                      className="flex-1 rounded-md border border-border bg-background p-2 text-foreground placeholder:text-muted-foreground"
                      placeholder={placeholder}
                      value={formData.socials[platform] || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        socials: { ...formData.socials, [platform]: e.target.value }
                      })}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setStep("questions")}
                >
                  Skip
                </button>
                <PrimaryButton onClick={handleSocialsStep} className="flex-1">
                  Continue
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Questions Step */}
          {step === "questions" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Profile Complete!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You&apos;ve earned {profile.points.toLocaleString()} points
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="font-semibold">Trust Score: {profile.trustScore}/100</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Next: Create your Soul Seed and begin your journey with Eva
                  </div>
                </div>
              </div>

              <PrimaryButton onClick={handleComplete} className="w-full">
                Continue to Soul Seed Creation
              </PrimaryButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 