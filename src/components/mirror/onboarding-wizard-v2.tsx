"use client";

import React, { useState } from "react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { SocialPlatform, OnboardingStep, UserProfile } from "@/lib/mirror/types";
import { calculateTrustScore } from "@/lib/mirror/profile";
import { track } from "@/lib/mirror/analytics";
import PrimaryButton from "@/components/primary-button";
import GlassCard from "@/components/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, FileText, Instagram, Linkedin, Youtube, AtSign, Video, Mail } from "lucide-react";

const SOCIAL_CONFIGS: Array<{
  platform: SocialPlatform;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}> = [
  { platform: "email", label: "Email", placeholder: "you@example.com", icon: <Mail className="h-4 w-4" /> },
  { platform: "discord", label: "Discord", placeholder: "username#1234", icon: <AtSign className="h-4 w-4" /> },
  { platform: "instagram", label: "Instagram", placeholder: "@username", icon: <Instagram className="h-4 w-4" /> },
  { platform: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/username", icon: <Linkedin className="h-4 w-4" /> },
  { platform: "youtube", label: "YouTube", placeholder: "@channel", icon: <Youtube className="h-4 w-4" /> },
  { platform: "tiktok", label: "TikTok", placeholder: "@username", icon: <Video className="h-4 w-4" /> },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizardV2({ onComplete }: OnboardingWizardProps) {
  const { profile, updateProfile, markOnboarded } = useUnifiedProfile();
  const [step, setStep] = useState<OnboardingStep>("personal");
  const [formData, setFormData] = useState({
    fullName: profile?.personalInfo?.fullName || "",
    location: profile?.personalInfo?.location || "",
    bio: profile?.personalInfo?.bio || "",
    socials: {} as Record<SocialPlatform, string>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = ["personal", "socials", "questions"].indexOf(step);
  const progressPct = Math.round(((stepIndex + 1) / 3) * 100);

  async function handlePersonalStep() {
    if (!profile) return;
    
    setIsSubmitting(true);
    try {
      const personalInfo = {
        fullName: formData.fullName,
        location: formData.location,
        bio: formData.bio,
      };

      // Update profile with new personal info
      const success = await updateProfile({
        personalInfo,
        trustScore: calculateTrustScore({ 
          ...profile, 
          personalInfo 
        })
      });

      if (success) {
        track("onboarding_personal_completed");
        setStep("socials");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialsStep() {
    if (!profile) return;
    
    setIsSubmitting(true);
    try {
      // Build social profiles array
      const socialProfiles = Object.entries(formData.socials)
        .filter(([_, handle]) => handle && handle.trim())
        .map(([platform, handle]) => ({
          platform: platform as SocialPlatform,
          handle,
          profileUrl: generateProfileUrl(platform as SocialPlatform, handle),
          verified: false,
          addedAt: Date.now()
        }));

      // Update profile with social profiles
      const success = await updateProfile({
        socialProfiles,
        trustScore: calculateTrustScore({ 
          ...profile, 
          socialProfiles 
        })
      });

      if (success) {
        track("onboarding_socials_completed", { count: socialProfiles.length });
        setStep("questions");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleComplete() {
    setIsSubmitting(true);
    try {
      // Mark onboarding as complete in Supabase
      await markOnboarded();
      track("onboarding_wizard_completed");
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <GlassCard className="max-w-md mx-auto mt-8 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Complete Your Profile</h2>
          <span className="text-sm text-muted-foreground">{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "personal" && (
          <motion.div
            key="personal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <PrimaryButton 
                onClick={handlePersonalStep}
                disabled={!formData.fullName || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Continue"}
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {step === "socials" && (
          <motion.div
            key="socials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4">Social Profiles</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your social profiles to build trust and earn points (optional)
            </p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {SOCIAL_CONFIGS.map(({ platform, label, placeholder, icon }) => (
                <div key={platform}>
                  <label className="block text-sm font-medium mb-1">
                    <span className="inline-flex items-center gap-1">
                      {icon}
                      {label}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.socials[platform] || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      socials: { ...formData.socials, [platform]: e.target.value }
                    })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep("personal")}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Back
              </button>
              <PrimaryButton 
                onClick={handleSocialsStep}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Continue"}
              </PrimaryButton>
            </div>
          </motion.div>
        )}

        {step === "questions" && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold mb-4">Almost Done!</h3>
            <p className="text-sm text-muted-foreground">
              Your profile has been saved. You'll now continue to Eva's Mirror where you can:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Choose your conversation style</li>
              <li>Answer reflective questions</li>
              <li>Build your digital soul</li>
              <li>Earn points for thoughtful responses</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
              <p className="text-sm text-green-800">
                ✓ Profile saved successfully! Your information is now stored securely.
              </p>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep("socials")}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Back
              </button>
              <PrimaryButton 
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Completing..." : "Enter Eva's Mirror"}
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

function generateProfileUrl(platform: SocialPlatform, handle: string): string {
  const cleanHandle = handle.replace(/^@/, '');
  
  switch (platform) {
    case "email":
      return `mailto:${handle}`;
    case "discord":
      return `https://discord.com/users/${cleanHandle}`;
    case "instagram":
      return `https://instagram.com/${cleanHandle}`;
    case "linkedin":
      return handle.includes('linkedin.com') ? handle : `https://linkedin.com/in/${cleanHandle}`;
    case "youtube":
      return `https://youtube.com/@${cleanHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${cleanHandle}`;
    default:
      return "";
  }
}
