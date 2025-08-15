import { Artifact } from "@/lib/mirror/types";

export default function RewardReveal({ artifact }: { artifact: Artifact | null }) {
  if (!artifact) return null;
  return (
    <div className="rounded-lg border border-border p-4 text-center bg-card text-card-foreground">
      <div className="text-sm opacity-70">Reward Unlocked</div>
      <div className="text-3xl">{artifact.symbol}</div>
      <div className="font-semibold">{artifact.name}</div>
      <div className="text-xs opacity-70">{artifact.rarity}</div>
    </div>
  );
} 