import { SoulSeed } from "@/lib/mirror/types";
import { calculateTrustScore } from "@/lib/mirror/profile";

export default function SoulSeedCard({ seed }: { seed: SoulSeed }) {
  const top = Object.entries(seed.traits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Calculate trust score with penalties
  const trustScore = seed.profile 
    ? calculateTrustScore(seed.profile, seed.trustPenalty || 0)
    : 0;
    
  return (
    <div className="rounded-lg border border-border p-4 bg-card text-card-foreground">
      <div className="text-sm opacity-70">Soul Seed</div>
      <div className="text-xl font-semibold">{seed.alias}</div>
      <div className="text-sm">Vibe: {seed.vibe}</div>
      <div className="mt-2 flex gap-4 text-sm">
        <span>Level {seed.level}</span>
        <span>Streak {seed.streakCount}d</span>
        {seed.profile && (
          <span className={seed.trustPenalty ? "text-red-500" : ""}>
            Trust {trustScore}%
          </span>
        )}
      </div>
      {seed.offensiveCount && seed.offensiveCount > 0 && (
        <div className="mt-2 text-xs text-red-500">
          ⚠️ {seed.offensiveCount} offensive response{seed.offensiveCount > 1 ? "s" : ""} detected
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {top.map(([k, v]) => (
          <div key={k} className="rounded border border-border p-2 text-center bg-muted text-muted-foreground">
            <div>{k}</div>
            <div className="font-semibold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 