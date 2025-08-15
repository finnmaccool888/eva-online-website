"use client";

import React from "react";

export default function InsightCard({ title, excerpt, symbol }: { title: string; excerpt: string; symbol: string }) {
  async function share() {
    const text = `${symbol} ${title}\n\n${excerpt}`;
    if (navigator.share) {
      await navigator.share({ text, title: "Eva Mirror" });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    }
  }
  return (
    <div className="rounded-lg border border-border p-4 bg-card text-card-foreground">
      <div className="text-2xl">{symbol}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm opacity-70">{excerpt}</div>
      <button className="mt-2 rounded border border-border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground" onClick={share} type="button">
        Share
      </button>
    </div>
  );
} 