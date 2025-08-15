import { Prompt } from "./types";

export const DAILY_PROMPTS: Prompt[] = [
	{ id: "p_psych_001", theme: "psychological", text: "If you could tweak one core belief about yourself, what would it be and why?", chipSuggestions: ["fear of failure", "self-trust", "discipline", "worthiness"], inputType: "micro" },
	{ id: "p_models_001", theme: "mentalModels", text: "When things get chaotic, what do you lean on first: patterns, faith, or will?", chipSuggestions: ["patterns", "faith", "sheer will", "pause and observe"], inputType: "micro" },
	{ id: "p_spirit_001", theme: "spiritual", text: "What does 'God' mean to you—if anything—and how has that shaped your path?", chipSuggestions: ["awe", "nature", "none", "mystery"], inputType: "text" },
	{ id: "p_values_001", theme: "values", text: "What value would you die for, and why?", chipSuggestions: ["freedom", "honesty", "love", "loyalty"], inputType: "micro" },
	{ id: "p_emote_001", theme: "emotional", text: "Which emotion rules your inner space right now, and how does it color your view?", chipSuggestions: ["calm", "anxiety", "hope", "frustration"], inputType: "micro" },
	{ id: "p_psych_002", theme: "psychological", text: "What belief about humanity have you changed your mind on?", chipSuggestions: ["people are good", "everyone's selfish", "tribes matter", "forgiveness"], inputType: "micro" },
	{ id: "p_models_002", theme: "mentalModels", text: "What's your favorite model for making decisions fast?", chipSuggestions: ["expected value", "first principles", "regret minimization", "intuition"], inputType: "micro" },
	{ id: "p_spirit_002", theme: "spiritual", text: "Where do you find awe most easily?", chipSuggestions: ["music", "nature", "math", "silence"], inputType: "micro" },
	{ id: "p_values_002", theme: "values", text: "What value do you compromise on most, and why?", chipSuggestions: ["comfort", "speed", "honesty", "loyalty"], inputType: "micro" },
	{ id: "p_emote_002", theme: "emotional", text: "When stressed, what calms your signal?", chipSuggestions: ["walk", "call a friend", "journal", "breathe"], inputType: "micro" },
	{ id: "p_social_001", theme: "social", text: "If you could fix one societal bug, which?", chipSuggestions: ["coordination", "education", "healthcare", "corruption"], inputType: "micro" },
	{ id: "p_social_002", theme: "social", text: "What's your ideal human bond?", chipSuggestions: ["trust", "play", "honesty", "depth"], inputType: "micro" },
	{ id: "p_history_001", theme: "history", text: "A moment that reshaped how you see people?", chipSuggestions: ["betrayal", "team win", "mentor", "loss"], inputType: "micro" },
	{ id: "p_history_002", theme: "history", text: "What chapter of your story reveals your true self?", chipSuggestions: ["struggle", "risk", "service", "art"], inputType: "micro" },
	{ id: "p_habits_001", theme: "habits", text: "What tiny habit moves you forward most?", chipSuggestions: ["sleep", "sunlight", "reading", "calls"], inputType: "micro" },
	{ id: "p_habits_002", theme: "habits", text: "What habit do you want to drop?", chipSuggestions: ["doomscroll", "late nights", "overcommit", "people-pleasing"], inputType: "micro" },
	{ id: "p_passions_001", theme: "passions", text: "What passion keeps your flame alive?", chipSuggestions: ["writing", "music", "training", "building"], inputType: "micro" },
	{ id: "p_passions_002", theme: "passions", text: "Where do you enter flow?", chipSuggestions: ["coding", "drawing", "running", "talking"], inputType: "micro" },
	{ id: "p_models_003", theme: "mentalModels", text: "Signal vs. noise: what's your filter?", chipSuggestions: ["mute", "lists", "rituals", "fasting from feeds"], inputType: "micro" },
	{ id: "p_values_003", theme: "values", text: "Draw a line you won't cross.", chipSuggestions: ["lying", "cheating", "ghosting", "quitting early"], inputType: "micro" },
	{ id: "p_psych_003", theme: "psychological", text: "What core fear do you befriend, not fight?", chipSuggestions: ["failure", "rejection", "loss", "irrelevance"], inputType: "micro" },
	{ id: "p_emote_003", theme: "emotional", text: "What emotion do you trust most?", chipSuggestions: ["awe", "joy", "calm", "grief"], inputType: "micro" },
	{ id: "p_social_003", theme: "social", text: "One change to improve online discourse?", chipSuggestions: ["rate limits", "reputation", "long-form", "quiet rooms"], inputType: "micro" },
	{ id: "p_history_003", theme: "history", text: "Name a mentor and their gift to you.", chipSuggestions: ["courage", "focus", "patience", "craft"], inputType: "micro" },
	{ id: "p_habits_003", theme: "habits", text: "Morning ritual MVP?", chipSuggestions: ["water", "walk", "write", "weights"], inputType: "micro" },
	{ id: "p_passions_003", theme: "passions", text: "If money didn't matter, you'd spend time on...", chipSuggestions: ["community", "art", "research", "coaching"], inputType: "micro" },
	{ id: "p_psych_004", theme: "psychological", text: "What truth do you tell yourself when it's hard?", chipSuggestions: ["I can adapt", "this will pass", "ask for help", "one step"], inputType: "micro" },
	{ id: "p_models_004", theme: "mentalModels", text: "What lens explains markets to you?", chipSuggestions: ["reflexivity", "liquidity", "memes", "incentives"], inputType: "micro" },
	{ id: "p_spirit_003", theme: "spiritual", text: "Where do you feel most connected to everything?", chipSuggestions: ["sea", "stars", "forest", "crowd"], inputType: "micro" },
	{ id: "p_values_004", theme: "values", text: "What do you protect at all costs?", chipSuggestions: ["family", "health", "attention", "integrity"], inputType: "micro" },
];

export function pickDaily(count: number): Prompt[] {
	const shuffled = [...DAILY_PROMPTS].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, Math.max(1, Math.min(count, DAILY_PROMPTS.length)));
} 