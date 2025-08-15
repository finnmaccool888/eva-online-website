"use client";

import React, { useMemo, useState } from "react";
import ChipInput from "./chip-input";
import { pickDaily } from "@/lib/mirror/prompts";
import { feedSeed, loadSeed } from "@/lib/mirror/seed";
import RewardReveal from "./reward-reveal";
import SoulSeedCard from "./soul-seed-card";
import PrimaryButton from "@/components/primary-button";
import { track } from "@/lib/mirror/analytics";

export default function DailyTransmission() {
  const prompts = useMemo(() => pickDaily(1), []);
  const prompt = prompts[0];
  const [seed, setSeed] = useState(loadSeed());
  const [answer, setAnswer] = useState("");
  const [reward, setReward] = useState<import("@/lib/mirror/types").Artifact | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    if (!answer.trim()) return;
    const { seed: updated } = feedSeed(seed, prompt.id, answer);
    setSeed(updated);
    setAnswer("");
    setDone(true);
    const last = updated.artifacts[updated.artifacts.length - 1] || null;
    setReward(last);
    track("prompt_answered", { promptId: prompt.id });
    track("streak_day", { streak: updated.streakCount });
    if (last) track("reward_revealed", { rarity: last.rarity });
  }

  return (
    <div className="flex flex-col gap-4">
      <SoulSeedCard seed={seed} />
      <div className="rounded-lg border border-border p-4 bg-card text-card-foreground">
        <div className="text-sm opacity-70">Eva asks</div>
        <div className="text-lg font-medium">{prompt.text}</div>
        <div className="mt-3">
          <ChipInput
            placeholder="Your reflection..."
            chips={prompt.chipSuggestions}
            value={answer}
            onChange={setAnswer}
          />
        </div>
        <div className="mt-3">
          <PrimaryButton onClick={submit}>Feed the Seed</PrimaryButton>
        </div>
      </div>
      {done && <RewardReveal artifact={reward} />}
    </div>
  );
} 