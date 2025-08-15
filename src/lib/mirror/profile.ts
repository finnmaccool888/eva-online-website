import { UserProfile, SocialPlatform } from "./types";
import { readJson, writeJson, StorageKeys } from "./storage";

const POINTS_PER_SOCIAL = 1000;

export function createEmptyProfile(): UserProfile {
  return {
    twitterVerified: false,
    personalInfo: {},
    socialProfiles: [],
    points: 0,
    trustScore: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadProfile(): UserProfile {
  return readJson<UserProfile>(StorageKeys.userProfile, createEmptyProfile());
}

export function saveProfile(profile: UserProfile): void {
  profile.updatedAt = Date.now();
  writeJson(StorageKeys.userProfile, profile);
}

export function calculatePoints(profile: UserProfile): number {
  let points = 0;
  
  // Twitter verification
  if (profile.twitterVerified) points += POINTS_PER_SOCIAL;
  
  // Personal info completion
  const personalFields = [profile.personalInfo.fullName, profile.personalInfo.location, profile.personalInfo.bio];
  const filledFields = personalFields.filter(f => f && f.trim().length > 0).length;
  points += filledFields * 333; // ~1000 points total for all personal info
  
  // Social profiles
  points += profile.socialProfiles.length * POINTS_PER_SOCIAL;
  
  return points;
}

export function calculateTrustScore(profile: UserProfile, trustPenalty: number = 0): number {
  let score = 0;
  
  // Base score for Twitter verification
  if (profile.twitterVerified) score += 20;
  
  // Personal info completeness (up to 30 points)
  const personalFields = [profile.personalInfo.fullName, profile.personalInfo.location, profile.personalInfo.bio];
  const filledFields = personalFields.filter(f => f && f.trim().length > 0).length;
  score += filledFields * 10;
  
  // Social profiles (5 points each, up to 30)
  score += Math.min(profile.socialProfiles.length * 5, 30);
  
  // Verified socials bonus
  const verifiedCount = profile.socialProfiles.filter(s => s.verified).length;
  score += verifiedCount * 5;
  
  // Apply trust penalty from bad responses
  score = Math.max(0, score + trustPenalty);
  
  return Math.min(score, 100); // Cap at 100
}

export function addSocialProfile(
  profile: UserProfile,
  platform: SocialPlatform,
  handle: string,
  profileUrl?: string
): UserProfile {
  const updated = { ...profile };
  
  // Remove existing profile for this platform if any
  updated.socialProfiles = updated.socialProfiles.filter(s => s.platform !== platform);
  
  // Add new profile
  updated.socialProfiles.push({
    platform,
    handle,
    profileUrl: profileUrl || generateProfileUrl(platform, handle),
    verified: false,
    addedAt: Date.now(),
  });
  
  // Recalculate points and trust score
  updated.points = calculatePoints(updated);
  updated.trustScore = calculateTrustScore(updated);
  
  return updated;
}

export function generateProfileUrl(platform: SocialPlatform, handle: string): string {
  const cleanHandle = handle.replace(/^@/, '');
  
  switch (platform) {
    case "email":
      return `mailto:${handle}`;
    case "discord":
      return `https://discord.com/users/${cleanHandle}`;
    case "instagram":
      return `https://instagram.com/${cleanHandle}`;
    case "linkedin":
      return `https://linkedin.com/in/${cleanHandle}`;
    case "youtube":
      return `https://youtube.com/@${cleanHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${cleanHandle}`;
    default:
      return "";
  }
} 