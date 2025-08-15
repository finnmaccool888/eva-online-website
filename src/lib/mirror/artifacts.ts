import { Artifact, ArtifactRarity } from "./types";

const POOL: Artifact[] = [
  { id: "a_star_dust", name: "Stardust Speck", rarity: "common", acquiredAt: 0, symbol: "✦" },
  { id: "a_orb_glow", name: "Orb of Calm", rarity: "common", acquiredAt: 0, symbol: "◯" },
  { id: "a_echo_leaf", name: "Echo Leaf", rarity: "uncommon", acquiredAt: 0, symbol: "❧" },
  { id: "a_sigil_truth", name: "Sigil of Truth", rarity: "rare", acquiredAt: 0, symbol: "⚚" },
  { id: "a_constellation", name: "Tiny Constellation", rarity: "legendary", acquiredAt: 0, symbol: "✺" },
];

const WEIGHTS: Record<ArtifactRarity, number> = {
  common: 70,
  uncommon: 22,
  rare: 7,
  legendary: 1,
};

export function drawRandomArtifact(): Artifact {
  const rarity = weightedRarity();
  const candidates = POOL.filter((a) => a.rarity === rarity);
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { ...pick, acquiredAt: Date.now(), id: `${pick.id}_${Date.now()}` };
}

function weightedRarity(): ArtifactRarity {
  const total = Object.values(WEIGHTS).reduce((s, n) => s + n, 0);
  let r = Math.random() * total;
  for (const [rar, w] of Object.entries(WEIGHTS)) {
    if (r < w) return rar as ArtifactRarity;
    r -= w;
  }
  return "common";
} 