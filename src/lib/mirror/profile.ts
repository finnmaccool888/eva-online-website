import { UserProfile, SocialPlatform } from "./types";
import { readJson, writeJson, StorageKeys } from "./storage";
import { POINTS, calculateBasePoints, calculateMinimumPoints } from '@/lib/constants/points';

const POINTS_PER_SOCIAL = 1000;
const POINTS_PER_PERSONAL_FIELD = 333; // ~1000 points for all personal info

export function createEmptyProfile(isOG: boolean = false): UserProfile {
  return {
    twitterVerified: false,
    personalInfo: {},
    socialProfiles: [],
    points: calculateBasePoints(isOG), // Start with base points + OG bonus if applicable
    trustScore: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isOG,
    ogPointsAwarded: isOG
  };
}

export function loadProfile(): UserProfile {
  return readJson<UserProfile>(StorageKeys.userProfile, createEmptyProfile());
}

export function saveProfile(profile: UserProfile): void {
  profile.updatedAt = Date.now();
  writeJson(StorageKeys.userProfile, profile);
}

/**
 * Calculate additional points from profile completion
 * These points are added on top of base points and session points
 */
export function calculatePoints(profile: UserProfile): number {
  if (!profile) {
    console.error('[CalculatePoints] Profile is null or undefined');
    return 0;
  }

  let additionalPoints = 0;
  
  // Twitter verification
  if (profile.twitterVerified) additionalPoints += POINTS_PER_SOCIAL;
  
  // Personal info completion
  const personalInfo = profile.personalInfo || {};
  const personalFields = [personalInfo.fullName, personalInfo.location, personalInfo.bio];
  const filledFields = personalFields.filter(f => f && f.trim().length > 0).length;
  additionalPoints += filledFields * POINTS_PER_PERSONAL_FIELD;
  
  // Social profiles
  additionalPoints += (profile.socialProfiles || []).length * POINTS_PER_SOCIAL;
  
  return additionalPoints;
}

// Calculate total points including session history
/**
 * Calculate total points including base, OG bonus, session points, and profile completion
 */
export function calculateTotalPoints(profile: UserProfile): number {
  // Add null check
  if (!profile) {
    console.error('[CalculateTotalPoints] Profile is null or undefined');
    return 0;
  }

  // Start with base points + OG bonus if applicable
  let totalPoints = calculateBasePoints(profile.isOG || false);
  
  // Add session points
  if (profile.sessionHistory && Array.isArray(profile.sessionHistory)) {
    totalPoints += profile.sessionHistory.reduce((sum, session) => {
      return sum + (session.pointsEarned || 0);
    }, 0);
  }

  // Add points from profile completion
  totalPoints += calculatePoints(profile);

  // Log point calculation for debugging
  console.log('[CalculateTotalPoints]', {
    twitterHandle: profile.twitterHandle,
    isOG: profile.isOG,
    basePoints: calculateBasePoints(profile.isOG || false),
    sessionPoints: profile.sessionHistory?.reduce((sum, s) => sum + (s.pointsEarned || 0), 0) || 0,
    profilePoints: calculatePoints(profile),
    totalPoints
  });
  
  return totalPoints;
}

// Update profile points based on session history and recalculate totals
/**
 * Update profile points and ensure minimum requirements are met
 */
export function updateProfilePoints(profile: UserProfile): UserProfile {
  const updated = { ...profile };
  
  // Recalculate total points
  const newPoints = calculateTotalPoints(updated);
  
  // Ensure minimum points requirement is met
  const minimumPoints = calculateMinimumPoints(updated.isOG || false);
  updated.points = Math.max(newPoints, minimumPoints);
  
  // Update trust score
  updated.trustScore = calculateTrustScore(updated);
  
  // Log point update for debugging
  console.log('[UpdateProfilePoints]', {
    twitterHandle: updated.twitterHandle,
    isOG: updated.isOG,
    oldPoints: profile.points,
    calculatedPoints: newPoints,
    minimumRequired: minimumPoints,
    finalPoints: updated.points
  });
  
  return updated;
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