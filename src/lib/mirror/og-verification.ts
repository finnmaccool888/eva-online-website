// OG List verification utilities
import ogListRaw from '@/data/ogList.json';

// Cache the OG list as a Set for O(1) lookup
const ogSet = new Set<string>(ogListRaw.map((name: string) => name.toLowerCase()));

export function isOG(twitterHandle: string): boolean {
  // Remove @ if present and convert to lowercase
  const cleanHandle = twitterHandle.replace('@', '').toLowerCase();
  return ogSet.has(cleanHandle);
}

export function getOGCount(): number {
  return ogSet.size;
}

// OG benefits
export const OG_POINTS = 10000;
export const OG_MESSAGE = "Welcome to EVA's exclusive beta. You're one of the chosen few!";
export const OG_IMAGE_URL = "https://i.imgur.com/5N2MrUz.jpeg"; 