import { UserProfile } from './types';
import { loadProfile } from './profile';

export const MAX_SESSIONS_PER_24H = 3;

export interface SessionLimitStatus {
  canStartSession: boolean;
  sessionsUsed: number;
  sessionsRemaining: number;
  nextAvailableTime: number | null; // timestamp when next session is available
  oldestSessionTime: number | null; // timestamp of the oldest session in 24h window
}

/**
 * Check if user can start a new session based on 24-hour rolling limit
 */
export function checkSessionLimit(profile?: UserProfile): SessionLimitStatus {
  // If no profile provided, load it
  const userProfile = profile || loadProfile();
  
  // If no session history, user can definitely start
  if (!userProfile.sessionHistory || userProfile.sessionHistory.length === 0) {
    return {
      canStartSession: true,
      sessionsUsed: 0,
      sessionsRemaining: MAX_SESSIONS_PER_24H,
      nextAvailableTime: null,
      oldestSessionTime: null
    };
  }
  
  // Get current time and 24 hours ago
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
  
  // Filter sessions within the last 24 hours
  const recentSessions = userProfile.sessionHistory.filter(session => 
    session.date > twentyFourHoursAgo
  );
  
  // Sort by date to find the oldest session
  const sortedRecentSessions = [...recentSessions].sort((a, b) => a.date - b.date);
  
  const sessionsUsed = recentSessions.length;
  const canStartSession = sessionsUsed < MAX_SESSIONS_PER_24H;
  const sessionsRemaining = Math.max(0, MAX_SESSIONS_PER_24H - sessionsUsed);
  
  // Calculate when the next session will be available
  let nextAvailableTime: number | null = null;
  let oldestSessionTime: number | null = null;
  
  if (!canStartSession && sortedRecentSessions.length > 0) {
    // The oldest session in the 24h window will expire first
    oldestSessionTime = sortedRecentSessions[0].date;
    nextAvailableTime = oldestSessionTime + (24 * 60 * 60 * 1000);
  }
  
  return {
    canStartSession,
    sessionsUsed,
    sessionsRemaining,
    nextAvailableTime,
    oldestSessionTime
  };
}

/**
 * Format time until next available session
 */
export function formatTimeUntilNextSession(nextAvailableTime: number): string {
  const now = Date.now();
  const timeRemaining = nextAvailableTime - now;
  
  if (timeRemaining <= 0) {
    return "now";
  }
  
  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}
