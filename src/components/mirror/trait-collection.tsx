"use client";

import React from "react";
import { loadSeed } from "@/lib/mirror/seed";
import { getTrait, getTraitStats } from "@/lib/mirror/traits-v2";
import { motion } from "framer-motion";

export default function TraitCollection() {
  const seed = loadSeed();
  const earnedTraits = seed?.earnedTraits || [];
  const stats = getTraitStats(earnedTraits);

  if (earnedTraits.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 bg-card text-card-foreground text-center">
        <p className="text-sm text-muted-foreground">
          No traits discovered yet. Answer Eva&apos;s questions to unlock your identity markers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4 bg-card text-card-foreground">
        <h3 className="font-medium mb-3">Your Traits</h3>
        
        {/* Trait Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {earnedTraits.map((earned, idx) => {
            const trait = getTrait(earned.traitId);
            if (!trait) return null;

            return (
              <motion.div
                key={earned.traitId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`
                  rounded-lg p-3 border
                  ${trait.rarity === 'legendary' ? 'border-yellow-500/50 bg-yellow-500/5' :
                    trait.rarity === 'rare' ? 'border-red-900/50 bg-red-900/5' :
                    trait.rarity === 'uncommon' ? 'border-blue-500/50 bg-blue-500/5' :
                    'border-border bg-muted/30'}
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{trait.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{trait.name}</h4>
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded-full
                        ${trait.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                          trait.rarity === 'rare' ? 'bg-red-900/20 text-red-900' :
                          trait.rarity === 'uncommon' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'}
                      `}>
                        {trait.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {trait.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-mono opacity-70">
                        {trait.hashtag}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-red-900 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${earned.strength}%` }}
                            transition={{ delay: idx * 0.1 + 0.3 }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {earned.strength}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Summary */}
        {earnedTraits.length >= 3 && (
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between text-sm">
              {stats.dominant && (
                <div>
                  <span className="text-muted-foreground">Dominant:</span>{' '}
                  <span className="font-medium capitalize">{stats.dominant}</span>
                </div>
              )}
              {stats.rare.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Rare:</span>{' '}
                  <span className="font-mono text-xs">{stats.rare.join(' ')}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Strength:</span>{' '}
                <span className="font-medium">{Math.round(stats.strength)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 