import { readJson, writeJson, StorageKeys } from "./storage";

export interface TwitterAuth {
  twitterId: string;
  twitterHandle: string;
  twitterName?: string;
  profileImage?: string;
  verifiedAt: string;
  lastChecked: number;
  isOG?: boolean;
  ogPointsAwarded?: boolean;
}

export function getTwitterAuth(): TwitterAuth | null {
  return readJson<TwitterAuth | null>(StorageKeys.twitterAuth, null);
}

export function setTwitterAuth(auth: TwitterAuth): void {
  writeJson(StorageKeys.twitterAuth, auth);
}

export function clearTwitterAuth(): void {
  writeJson(StorageKeys.twitterAuth, null);
}

export function isAuthenticated(): boolean {
  const auth = getTwitterAuth();
  return auth !== null;
}

// Mock Twitter OAuth for now - replace with real OAuth later
export async function mockTwitterLogin(handle: string): Promise<TwitterAuth> {
  const auth: TwitterAuth = {
    twitterId: `mock_${Date.now()}`,
    twitterHandle: handle.startsWith('@') ? handle : `@${handle}`,
    twitterName: handle.replace('@', ''),
    profileImage: `https://unavatar.io/twitter/${handle.replace('@', '')}`,
    verifiedAt: new Date().toISOString(),
    lastChecked: Date.now(),
  };
  
  setTwitterAuth(auth);
  return auth;
}

export async function logout(): Promise<void> {
  // Clear all auth and profile data from localStorage
  clearTwitterAuth();
  
  // Use the storage module's remove function to properly clear namespaced keys
  Object.values(StorageKeys).forEach(key => {
    try {
      localStorage.removeItem(`eva_mirror_v1:${key}`);
    } catch (e) {
      console.error(`Failed to remove ${key}:`, e);
    }
  });
  
  // Also try to clear non-namespaced versions in case they exist
  localStorage.removeItem('twitter_auth');
  
  // Clear any client-side cookies
  document.cookie = 'twitter_auth_client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Clear auth cookie via API
  try {
    await fetch('/api/auth/twitter/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout API error:', error);
  }
  
  // Small delay to ensure cookies are cleared before redirect
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Redirect to mirror page which will trigger auth flow
  window.location.href = '/mirror';
} 