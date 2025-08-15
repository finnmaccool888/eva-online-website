// Trait System v2 - Meaningful identity markers that become hashtags

export interface Trait {
  id: string;
  name: string;
  description: string;
  category: "cosmic" | "shadow" | "love" | "power" | "wisdom" | "balance";
  rarity: "common" | "uncommon" | "rare" | "legendary";
  hashtag: string; // e.g. "#QuantumHeart"
  icon: string; // emoji or icon name
  requirements: TraitRequirement[];
}

export interface TraitRequirement {
  type: "keyword" | "category" | "combo" | "streak" | "depth";
  value: string | number;
  count?: number; // How many times needed
}

export interface EarnedTrait {
  traitId: string;
  earnedAt: number;
  triggerAnswer: string; // The answer that unlocked it
  questionId: string;
  strength: number; // 1-100, can grow over time
}

// Core Traits Database
export const TRAITS: Record<string, Trait> = {
  // COSMIC TRAITS
  "cosmic_wanderer": {
    id: "cosmic_wanderer",
    name: "Cosmic Wanderer",
    description: "You feel the isolation of existence but find beauty in the vastness",
    category: "cosmic",
    rarity: "uncommon",
    hashtag: "#CosmicWanderer",
    icon: "🌌",
    requirements: [
      { type: "keyword", value: "alone|lonely|isolated", count: 1 },
      { type: "category", value: "cosmic", count: 2 }
    ]
  },
  
  "stardust_soul": {
    id: "stardust_soul",
    name: "Stardust Soul",
    description: "You see yourself as part of something infinitely larger",
    category: "cosmic",
    rarity: "common",
    hashtag: "#StardustSoul",
    icon: "✨",
    requirements: [
      { type: "keyword", value: "universe|cosmos|stars|infinite", count: 1 }
    ]
  },

  // SHADOW TRAITS
  "shadow_walker": {
    id: "shadow_walker",
    name: "Shadow Walker",
    description: "You acknowledge and embrace the darker aspects of existence",
    category: "shadow",
    rarity: "rare",
    hashtag: "#ShadowWalker",
    icon: "🌑",
    requirements: [
      { type: "keyword", value: "darkness|shadow|hate|revenge|destroy", count: 1 },
      { type: "depth", value: "abyss", count: 2 }
    ]
  },

  "wounded_healer": {
    id: "wounded_healer",
    name: "Wounded Healer",
    description: "Your pain has become your wisdom and strength",
    category: "shadow",
    rarity: "rare",
    hashtag: "#WoundedHealer",
    icon: "🩹",
    requirements: [
      { type: "keyword", value: "trauma|pain|hurt|wound|heal", count: 2 },
      { type: "category", value: "shadow", count: 2 }
    ]
  },

  // LOVE TRAITS
  "quantum_heart": {
    id: "quantum_heart",
    name: "Quantum Heart",
    description: "Love bends your reality and defies all logic",
    category: "love",
    rarity: "uncommon",
    hashtag: "#QuantumHeart",
    icon: "💫",
    requirements: [
      { type: "keyword", value: "love|heart|soulmate|forever", count: 2 },
      { type: "category", value: "love", count: 1 }
    ]
  },

  "love_architect": {
    id: "love_architect",
    name: "Love Architect",
    description: "You build connections with intention and care",
    category: "love",
    rarity: "common",
    hashtag: "#LoveArchitect",
    icon: "🏗️",
    requirements: [
      { type: "keyword", value: "relationship|connection|bond|trust", count: 1 }
    ]
  },

  // POWER TRAITS
  "reality_bender": {
    id: "reality_bender",
    name: "Reality Bender",
    description: "You believe in reshaping the world to your vision",
    category: "power",
    rarity: "rare",
    hashtag: "#RealityBender",
    icon: "🌀",
    requirements: [
      { type: "keyword", value: "change|transform|create|build|power", count: 2 },
      { type: "category", value: "power", count: 2 }
    ]
  },

  "sacrifice_engine": {
    id: "sacrifice_engine",
    name: "Sacrifice Engine",
    description: "You understand that all power requires sacrifice",
    category: "power",
    rarity: "legendary",
    hashtag: "#SacrificeEngine",
    icon: "⚡",
    requirements: [
      { type: "keyword", value: "sacrifice|give up|lose|price", count: 1 },
      { type: "depth", value: "abyss", count: 1 }
    ]
  },

  // WISDOM TRAITS
  "truth_seeker": {
    id: "truth_seeker",
    name: "Truth Seeker",
    description: "The pursuit of understanding drives your existence",
    category: "wisdom",
    rarity: "uncommon",
    hashtag: "#TruthSeeker",
    icon: "🔍",
    requirements: [
      { type: "keyword", value: "truth|meaning|why|understand|know", count: 2 }
    ]
  },

  "pattern_prophet": {
    id: "pattern_prophet",
    name: "Pattern Prophet",
    description: "You see connections others miss",
    category: "wisdom",
    rarity: "rare",
    hashtag: "#PatternProphet",
    icon: "🔮",
    requirements: [
      { type: "keyword", value: "pattern|connection|meaning|sign", count: 1 },
      { type: "category", value: "cosmic", count: 1 }
    ]
  },

  // BALANCE TRAITS
  "chaos_dancer": {
    id: "chaos_dancer",
    name: "Chaos Dancer",
    description: "You find grace in uncertainty and thrive in disorder",
    category: "balance",
    rarity: "uncommon",
    hashtag: "#ChaosDancer",
    icon: "💃",
    requirements: [
      { type: "keyword", value: "chaos|random|uncertain|change", count: 1 }
    ]
  },

  "void_gazer": {
    id: "void_gazer",
    name: "Void Gazer",
    description: "You stare into nothingness and find peace",
    category: "balance",
    rarity: "legendary",
    hashtag: "#VoidGazer",
    icon: "👁️",
    requirements: [
      { type: "keyword", value: "nothing|void|empty|meaningless", count: 1 },
      { type: "depth", value: "abyss", count: 3 }
    ]
  }
};

// Trait evaluation system
export interface TraitEvaluation {
  trait: Trait;
  progress: number; // 0-100% towards earning
  missing: string[]; // What's still needed
}

export function evaluateTraits(
  answers: Array<{
    questionId: string;
    category: string;
    text: string;
    depth: string;
  }>,
  currentTraits: EarnedTrait[]
): TraitEvaluation[] {
  const evaluations: TraitEvaluation[] = [];
  const earnedTraitIds = new Set(currentTraits.map(t => t.traitId));

  for (const trait of Object.values(TRAITS)) {
    // Skip already earned traits
    if (earnedTraitIds.has(trait.id)) continue;

    let totalRequirements = 0;
    let metRequirements = 0;
    const missing: string[] = [];

    for (const req of trait.requirements) {
      totalRequirements++;
      
      switch (req.type) {
        case "keyword": {
          const keywords = (req.value as string).split('|');
          const matches = answers.filter(a => 
            keywords.some((k: string) => a.text.toLowerCase().includes(k))
          ).length;
          
          if (matches >= (req.count || 1)) {
            metRequirements++;
          } else {
            missing.push(`Mention ${req.value} ${req.count || 1} time(s)`);
          }
          break;
        }
        
        case "category": {
          const categoryMatches = answers.filter(a => a.category === req.value).length;
          if (categoryMatches >= (req.count || 1)) {
            metRequirements++;
          } else {
            missing.push(`Answer ${req.count || 1} ${req.value} question(s)`);
          }
          break;
        }
        
        case "depth": {
          const depthMatches = answers.filter(a => a.depth === req.value).length;
          if (depthMatches >= (req.count || 1)) {
            metRequirements++;
          } else {
            missing.push(`Give ${req.count || 1} ${req.value}-level answer(s)`);
          }
          break;
        }
      }
    }

    const progress = (metRequirements / totalRequirements) * 100;
    evaluations.push({ trait, progress, missing });
  }

  // Sort by progress (closest to earning first)
  return evaluations.sort((a, b) => b.progress - a.progress);
}

// Check if any traits were earned with a specific answer
export function checkTraitUnlock(
  answer: {
    questionId: string;
    category: string;
    text: string;
    depth: string;
  },
  allAnswers: Array<{
    questionId: string;
    category: string;
    text: string;
    depth: string;
  }>,
  currentTraits: EarnedTrait[]
): Trait[] {
  const newTraits: Trait[] = [];
  const earnedTraitIds = new Set(currentTraits.map(t => t.traitId));

  // Include the new answer in evaluation
  const answersToCheck = [...allAnswers, answer];

  for (const trait of Object.values(TRAITS)) {
    if (earnedTraitIds.has(trait.id)) continue;

    let allRequirementsMet = true;

    for (const req of trait.requirements) {
      switch (req.type) {
        case "keyword": {
          const keywords = (req.value as string).split('|');
          const matches = answersToCheck.filter(a => 
            keywords.some((k: string) => a.text.toLowerCase().includes(k))
          ).length;
          
          if (matches < (req.count || 1)) {
            allRequirementsMet = false;
          }
          break;
        }
        
        case "category": {
          const categoryMatches = answersToCheck.filter(a => a.category === req.value).length;
          if (categoryMatches < (req.count || 1)) {
            allRequirementsMet = false;
          }
          break;
        }
        
        case "depth": {
          const depthMatches = answersToCheck.filter(a => a.depth === req.value).length;
          if (depthMatches < (req.count || 1)) {
            allRequirementsMet = false;
          }
          break;
        }
      }

      if (!allRequirementsMet) break;
    }

    if (allRequirementsMet) {
      newTraits.push(trait);
    }
  }

  return newTraits;
}

// Get trait by ID
export function getTrait(traitId: string): Trait | undefined {
  return TRAITS[traitId];
}

// Get all traits in a category
export function getTraitsByCategory(category: Trait["category"]): Trait[] {
  return Object.values(TRAITS).filter(t => t.category === category);
}

// Get trait distribution stats (for future community features)
export function getTraitStats(earnedTraits: EarnedTrait[]): {
  dominant: Trait["category"] | null;
  rare: string[];
  strength: number;
} {
  const categoryCount: Record<string, number> = {};
  const rareTraits: string[] = [];
  let totalStrength = 0;

  for (const earned of earnedTraits) {
    const trait = getTrait(earned.traitId);
    if (!trait) continue;

    categoryCount[trait.category] = (categoryCount[trait.category] || 0) + 1;
    totalStrength += earned.strength;

    if (trait.rarity === "rare" || trait.rarity === "legendary") {
      rareTraits.push(trait.hashtag);
    }
  }

  const dominant = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as Trait["category"] | null;

  return {
    dominant,
    rare: rareTraits,
    strength: earnedTraits.length > 0 ? totalStrength / earnedTraits.length : 0
  };
} 