import { readJson, writeJson } from "./storage";
import { StorageKeys } from "./storage";

function b64(s: string): string {
  if (typeof window === "undefined") return s;
  return btoa(unescape(encodeURIComponent(s)));
}

function ub64(s: string): string {
  if (typeof window === "undefined") return s;
  return decodeURIComponent(escape(atob(s)));
}

export function generateEchoCode(promptId: string): string {
  const payload = { promptId, issuedAt: Date.now(), rnd: Math.random().toString(36).slice(2) };
  return b64(JSON.stringify(payload));
}

export function redeemEchoCode(code: string): { ok: boolean; promptId?: string; reason?: string } {
  try {
    const set = new Set(readJson<string[]>(StorageKeys.analyticsQueue + ":echo_redeemed", []));
    if (set.has(code)) return { ok: false, reason: "already_redeemed" };
    const json = ub64(code);
    const obj = JSON.parse(json);
    if (!obj?.promptId) return { ok: false, reason: "invalid" };
    set.add(code);
    writeJson(StorageKeys.analyticsQueue + ":echo_redeemed", Array.from(set));
    return { ok: true, promptId: obj.promptId };
  } catch {
    return { ok: false, reason: "invalid" };
  }
} 