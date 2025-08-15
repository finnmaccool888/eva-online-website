import React from "react";
import { SoulSeed } from "@/lib/mirror/types";

export default function Timeline({ seed }: { seed: SoulSeed }) {
  const recent = [...seed.memories].slice(-5).reverse();
  if (recent.length === 0) return null;
  return (
    <div className="rounded-lg border border-border p-4 bg-card text-card-foreground">
      <div className="text-sm opacity-70">Recent Memories</div>
      <ul className="mt-2 space-y-2 text-sm">
        {recent.map((m) => (
          <li key={m.id} className="border-b border-border pb-2 last:border-b-0">
            <div className="opacity-70">{new Date(m.createdAt).toLocaleString()}</div>
            <div className="line-clamp-3">{m.text}</div>
          </li>
        ))}
      </ul>
    </div>
  );
} 