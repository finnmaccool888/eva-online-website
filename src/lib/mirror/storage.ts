const NS = "eva_mirror_v1";

function key(k: string): string {
	return `${NS}:${k}`;
}

export function readJson<T>(k: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key(k));
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function writeJson<T>(k: string, value: T): void {
	try {
		localStorage.setItem(key(k), JSON.stringify(value));
	} catch {
		/* ignore */
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