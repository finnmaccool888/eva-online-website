import { TraitVector16, TraitKey } from "./types";

const BASE: TraitVector16 = {
	empathy: 50,
	noveltySeeking: 50,
	locusOfControl: 50,
	conscientiousness: 50,
	openness: 50,
	agreeableness: 50,
	extraversion: 50,
	emotionalStability: 50,
	riskTolerance: 50,
	spiritualAttunement: 50,
	systemsThinking: 50,
	intuition: 50,
	resilience: 50,
	authenticity: 50,
	altruism: 50,
	curiosity: 50,
};

const KEYWORD_DELTAS: Array<{ k: TraitKey; words: string[]; delta: number }> = [
	{ k: "curiosity", words: ["why", "wonder", "explore", "mystery"], delta: 3 },
	{ k: "spiritualAttunement", words: ["god", "soul", "sacred", "awe"], delta: 4 },
	{ k: "resilience", words: ["grit", "failure", "bounce", "persist"], delta: 4 },
	{ k: "conscientiousness", words: ["discipline", "routine", "habit"], delta: 3 },
	{ k: "agreeableness", words: ["kind", "forgive", "empathy"], delta: 3 },
	{ k: "riskTolerance", words: ["risk", "bet", "dare", "leap"], delta: 3 },
	{ k: "systemsThinking", words: ["system", "pattern", "network"], delta: 3 },
	{ k: "authenticity", words: ["truth", "authentic", "honest"], delta: 3 },
	{ k: "intuition", words: ["gut", "feel", "vibe"], delta: 3 },
];

export function createBaseTraits(): TraitVector16 {
	return { ...BASE };
}

export function applyTextToTraits(traits: TraitVector16, text: string): TraitVector16 {
	const t = { ...traits };
	const lower = text.toLowerCase();
	for (const rule of KEYWORD_DELTAS) {
		if (rule.words.some((w) => lower.includes(w))) {
			t[rule.k] = clamp01to100(t[rule.k] + rule.delta);
		}
	}
	return t;
}

function clamp01to100(n: number): number {
	return Math.max(0, Math.min(100, Math.round(n)));
} 