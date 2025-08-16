const NS = "eva_mirror_v1";

function key(k: string): string {
	return `${NS}:${k}`;
}

export function readJson<T>(k: string, fallback: T): T {
	try {
		const fullKey = key(k);
		const raw = localStorage.getItem(fullKey);
		console.log(`[storage] Reading key "${fullKey}":`, raw ? 'Found' : 'Not found');
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch (error) {
		console.error(`[storage] Error reading key "${key(k)}":`, error);
		return fallback;
	}
}

export function writeJson<T>(k: string, value: T): void {
	try {
		const fullKey = key(k);
		console.log(`[storage] Writing key "${fullKey}":`, value);
		localStorage.setItem(fullKey, JSON.stringify(value));
	} catch (error) {
		console.error(`[storage] Error writing key "${key(k)}":`, error);
	}
}

export function remove(k: string): void {
	try {
		localStorage.removeItem(key(k));
	} catch {
		/* ignore */
	}
}

export const StorageKeys = {
	soulSeed: "soul_seed",
	journalDraft: "journal_draft",
	streak: "streak",
	lastDaily: "last_daily",
	artifacts: "artifacts",
	analyticsQueue: "analytics_queue",
	onboarded: "onboarded",
	userProfile: "user_profile",
	twitterAuth: "twitter_auth",
} as const;

export function wipeAllMirrorLocal(): void {
	Object.values(StorageKeys).forEach((k) => remove(k));
} 