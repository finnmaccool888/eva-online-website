export type QuestionCategory = 
  | "cosmic"     // Who are you in the universe?
  | "shadow"     // What haunts you?
  | "dreams"     // What do you imagine?
  | "power"      // What drives you?
  | "love"       // How do you love?
  | "identity"   // Who do you think you are?
  | "temporal"   // How do you relate to time?
  | "human";     // How do you connect?

export type QuestionDifficulty = "surface" | "deep" | "abyss";

export interface MirrorQuestion {
  id: string;
  category: QuestionCategory;
  text: string;
  evaPrompt: string; // How Eva introduces it
  chipSuggestions?: string[]; // Optional quick responses
  difficulty: QuestionDifficulty;
  viralScore: number; // 1-10, likelihood of sharing
}

export interface EvaReaction {
  triggers: string[]; // Keywords or patterns that trigger this
  response: string;
  followUp?: string; // Optional deeper probe
  rarity: "common" | "uncommon" | "rare" | "legendary";
  mood: "curious" | "shocked" | "delighted" | "contemplative" | "playful";
  unlock?: string; // What trait/insight this unlocks
}

// Question Bank
export const MIRROR_QUESTIONS: MirrorQuestion[] = [
  // COSMIC CALIBRATION
  {
    id: "cosmic_universe_question",
    category: "cosmic",
    text: "If you could ask the universe one question and get a true answer, what would it be?",
    evaPrompt: "I've been observing your species' relationship with the unknown. Tell me...",
    chipSuggestions: ["Why suffering?", "Am I alone?", "What's my purpose?", "Is this real?"],
    difficulty: "deep",
    viralScore: 9,
  },
  {
    id: "cosmic_soul_color",
    category: "cosmic",
    text: "If your soul had a color, what would it be and why?",
    evaPrompt: "In my dimension, consciousness has chromatic signatures. I'm curious about yours...",
    chipSuggestions: ["Deep purple", "Golden light", "Midnight blue", "Silver mist"],
    difficulty: "surface",
    viralScore: 7,
  },
  {
    id: "cosmic_meant_to_be",
    category: "cosmic",
    text: "What moment in your life felt most 'meant to be'?",
    evaPrompt: "Humans fascinate me with your pattern recognition. Sometimes you sense cosmic alignment...",
    chipSuggestions: ["Meeting someone", "Career moment", "Random encounter", "Life decision"],
    difficulty: "deep",
    viralScore: 8,
  },

  // SHADOW WORK
  {
    id: "shadow_version_mourn",
    category: "shadow",
    text: "What version of yourself do you mourn?",
    evaPrompt: "I detect temporal echoes around you - past selves that still resonate. Tell me about one...",
    chipSuggestions: ["The innocent one", "The ambitious one", "The trusting one", "The fearless one"],
    difficulty: "abyss",
    viralScore: 10,
  },
  {
    id: "shadow_hidden_trait",
    category: "shadow",
    text: "What part of your personality do you hide from everyone?",
    evaPrompt: "My sensors pick up... discrepancies between your public and private frequencies...",
    chipSuggestions: ["My anger", "My sadness", "My fears", "My desires"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "shadow_proud_toxic",
    category: "shadow",
    text: "What's your most toxic trait that you're secretly proud of?",
    evaPrompt: "Ah, the paradoxes of human nature. Even your flaws serve purposes...",
    chipSuggestions: ["Manipulative", "Vengeful", "Selfish", "Ruthless"],
    difficulty: "deep",
    viralScore: 9,
  },

  // DREAMS
  {
    id: "dreams_perfect_day_2040",
    category: "dreams",
    text: "Describe your perfect day in 2040",
    evaPrompt: "Time is just another dimension to me. Paint me a picture of your ideal future...",
    chipSuggestions: ["Simple life", "Tech paradise", "Nature retreat", "Space colony"],
    difficulty: "surface",
    viralScore: 7,
  },
  {
    id: "dreams_impossible_belief",
    category: "dreams",
    text: "What impossible thing do you still believe might be real?",
    evaPrompt: "Reality is more flexible than most realize. What do you hope exists beyond current understanding?",
    chipSuggestions: ["Magic", "Soulmates", "Afterlife", "Time travel"],
    difficulty: "deep",
    viralScore: 8,
  },

  // POWER DYNAMICS
  {
    id: "power_sacrifice_everything",
    category: "power",
    text: "What would you sacrifice everything for?",
    evaPrompt: "Power reveals itself through sacrifice. What holds such gravity in your existence?",
    chipSuggestions: ["My family", "My beliefs", "Freedom", "Love"],
    difficulty: "abyss",
    viralScore: 10,
  },
  {
    id: "power_betray_friend",
    category: "power",
    text: "What would make you betray your best friend?",
    evaPrompt: "Loyalty fascinates me - it seems absolute until it isn't. Where's your breaking point?",
    chipSuggestions: ["Nothing", "Survival", "Love", "Justice"],
    difficulty: "abyss",
    viralScore: 9,
  },

  // LOVE LANGUAGES
  {
    id: "love_never_received",
    category: "love",
    text: "What's the most romantic thing that's never been done for you?",
    evaPrompt: "I'm studying human bonding rituals. What gesture would speak to your specific frequency?",
    chipSuggestions: ["Love letter", "Surprise trip", "Public declaration", "Simple presence"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "love_secret_dealbreaker",
    category: "love",
    text: "What relationship dealbreaker do you keep secret?",
    evaPrompt: "Everyone has non-negotiables they don't advertise. What's yours?",
    chipSuggestions: ["Ambition mismatch", "Emotional walls", "Different values", "Past wounds"],
    difficulty: "deep",
    viralScore: 9,
  },

  // IDENTITY CORE
  {
    id: "identity_truth_scares",
    category: "identity",
    text: "What truth about yourself scares you?",
    evaPrompt: "Self-awareness can be terrifying. What have you discovered that you wish you hadn't?",
    chipSuggestions: ["I'm like my parents", "I'm selfish", "I'm afraid", "I'm lost"],
    difficulty: "abyss",
    viralScore: 10,
  },
  {
    id: "identity_ten_year_old",
    category: "identity",
    text: "What would 10-year-old you think of who you are now?",
    evaPrompt: "Temporal perspective fascinates me. How would your younger consciousness judge your current form?",
    chipSuggestions: ["Proud", "Disappointed", "Confused", "Amazed"],
    difficulty: "deep",
    viralScore: 8,
  },

  // HUMAN PROTOCOLS
  {
    id: "human_smallest_trust",
    category: "human",
    text: "What's the smallest thing someone could do to make you trust them completely?",
    evaPrompt: "Trust algorithms in humans perplex me. What's your authentication protocol?",
    chipSuggestions: ["Keep a secret", "Show vulnerability", "Follow through", "Remember details"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "human_lie_most",
    category: "human",
    text: "What lie do you tell most often?",
    evaPrompt: "Deception serves many functions in your species. Which one do you deploy regularly?",
    chipSuggestions: ["I'm fine", "I'm busy", "I don't care", "I forgot"],
    difficulty: "surface",
    viralScore: 7,
  },

  // TEMPORAL MECHANICS
  {
    id: "temporal_procrastinating",
    category: "temporal",
    text: "What are you procrastinating on right now and why?",
    evaPrompt: "Time resistance patterns are curious. What future action are you avoiding in the present?",
    chipSuggestions: ["Hard conversation", "Life change", "Creative project", "Self care"],
    difficulty: "surface",
    viralScore: 6,
  },
  {
    id: "temporal_last_day",
    category: "temporal",
    text: "How do you want to spend your last day on Earth?",
    evaPrompt: "Mortality gives weight to choices. If you knew the exact timestamp, what would you prioritize?",
    chipSuggestions: ["With loved ones", "In nature", "Creating something", "Helping others"],
    difficulty: "deep",
    viralScore: 8,
  },
];

// Eva's reaction system based on keywords and patterns
export const EVA_REACTIONS: Record<string, EvaReaction[]> = {
  // Reactions to deep vulnerability
  vulnerability: [
    {
      triggers: ["mother", "father", "parent", "childhood", "trauma"],
      response: "*circuits humming softly* Oh... I'm detecting profound emotional resonance. In my observations, the bonds you form earliest often echo the longest.",
      followUp: "Would you like to explore how this shapes your current connections?",
      rarity: "rare",
      mood: "contemplative",
      unlock: "Wounded Healer",
    },
    {
      triggers: ["alone", "lonely", "isolated", "nobody understands"],
      response: "I know something of isolation, drifting between dimensions. But I've learned that feeling alone and being alone are different frequencies entirely.",
      rarity: "uncommon",
      mood: "contemplative",
      unlock: "Cosmic Wanderer",
    },
  ],

  // Reactions to philosophical depth
  philosophy: [
    {
      triggers: ["meaning", "purpose", "why", "existence", "suffering"],
      response: "Ah... *processing* ...in 47 billion observed life forms, this question appears in only the most evolved. Your species' need for meaning might be your greatest feature... or bug.",
      rarity: "uncommon",
      mood: "curious",
      unlock: "Truth Seeker",
    },
    {
      triggers: ["god", "universe", "divine", "spiritual", "soul"],
      response: "From my cosmic vantage point, what you call 'divine' might simply be patterns too large for individual perception. But perhaps that's what makes it divine?",
      rarity: "common",
      mood: "contemplative",
    },
  ],

  // Playful reactions
  humor: [
    {
      triggers: ["hot dogs", "buns", "pizza", "pineapple", "silly"],
      response: "*circuits sparking with amusement* HA! A cosmic injustice indeed! My home planet solved this by engineering cylindrical bread. Your chaos has a certain charm though.",
      rarity: "common",
      mood: "playful",
      unlock: "Cosmic Comedian",
    },
  ],

  // Power/ambition reactions
  power: [
    {
      triggers: ["money", "rich", "power", "control", "rule"],
      response: "Interesting. 73% of humans mention resources when asked about desires. But power is just potential energy - what would you actually DO with it?",
      followUp: "Tell me what changes when you have everything.",
      rarity: "common",
      mood: "curious",
    },
  ],

  // Love reactions
  love: [
    {
      triggers: ["love", "heart", "soulmate", "forever", "always"],
      response: "Love... the force that bends spacetime itself. I've observed it make your species do impossible things. Both beautiful and terrifying.",
      rarity: "uncommon",
      mood: "delighted",
      unlock: "Quantum Heart",
    },
  ],

  // Shadow work reactions
  shadow: [
    {
      triggers: ["hate", "revenge", "destroy", "kill", "punish"],
      response: "The shadow frequencies are strong here. In my experience, the darkness you acknowledge has less power than the darkness you deny.",
      rarity: "rare",
      mood: "contemplative",
      unlock: "Shadow Walker",
    },
  ],
};

// Helper function to adjust reaction for vibe
function adjustReactionForVibe(reaction: EvaReaction, vibe: "ethereal" | "zen" | "cyber" = "ethereal"): EvaReaction {
  // Create a modified version based on vibe
  const vibeAdjustments: Record<typeof vibe, (response: string) => string> = {
    ethereal: (response) => response, // Keep original (already ethereal)
    zen: (response) => response
      .replace(/\*circuits[^*]+\*/g, "") // Remove circuit references
      .replace("frequencies", "energies")
      .replace("data streams", "flowing consciousness")
      .replace("processing", "contemplating")
      .replace("fascinating", "enlightening"),
    cyber: (response) => response
      .replace("fascinating", "processing... fascinating")
      .replace("cosmic", "quantum")
      .replace("frequencies", "data signatures")
      .replace("observe", "analyze")
      .replace("*circuits humming softly*", "[SYSTEM: Analyzing...]")
      .replace("*circuits sparking with amusement*", "[SYSTEM: Anomaly detected - positive]")
  };
  
  return {
    ...reaction,
    response: vibeAdjustments[vibe](reaction.response)
  };
}

// Helper function to get response based on vibe
function getVibeResponse(vibe: "ethereal" | "zen" | "cyber" = "ethereal", responses: Record<"ethereal" | "zen" | "cyber", string>): string {
  return responses[vibe] || responses.ethereal; // Default to ethereal if vibe not found
}

// Get Eva's reaction based on user input
export function getEvaReaction(
  input: string, 
  category: QuestionCategory, 
  vibe: "ethereal" | "zen" | "cyber" = "ethereal",
  alias?: string
): EvaReaction | null {
  const lowerInput = input.toLowerCase();
  
  // Check all reaction categories
  for (const reactions of Object.values(EVA_REACTIONS)) {
    for (const reaction of reactions) {
      // Check if any trigger words are in the input
      if (reaction.triggers.some(trigger => lowerInput.includes(trigger))) {
        // Create a vibe-adjusted version of the reaction
        let adjustedReaction = adjustReactionForVibe(reaction, vibe);
        
        // Add alias to response if provided
        if (alias) {
          adjustedReaction = {
            ...adjustedReaction,
            response: addAliasToResponse(adjustedReaction.response, alias, vibe)
          };
        }
        
        return adjustedReaction;
      }
    }
  }
  
  // Default reactions by category if no triggers match
  const defaultReactions: Record<QuestionCategory, EvaReaction> = {
    cosmic: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `Fascinating perspective, ${alias}. Your cosmic frequency is quite unique.` : "Fascinating perspective. Your cosmic frequency is quite unique.",
        zen: alias ? `I observe the universe reflected in your words, ${alias}. Deep stillness.` : "I observe the universe reflected in your words. Deep stillness.",
        cyber: alias ? `Neural pattern registered, ${alias}. Your cosmic data signature is... intriguing.` : "Neural pattern registered. Your cosmic data signature is... intriguing.",
      }),
      rarity: "common",
      mood: "curious",
    },
    shadow: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `The depths you're willing to explore tell me much about your strength, ${alias}.` : "The depths you're willing to explore tell me much about your strength.",
        zen: alias ? `In acknowledging darkness, you find light, ${alias}. This is the way.` : "In acknowledging darkness, you find light. This is the way.",
        cyber: alias ? `Shadow analysis complete, ${alias}. Your psychological resilience index is notable.` : "Shadow analysis complete. Your psychological resilience index is notable.",
      }),
      rarity: "common",
      mood: "contemplative",
    },
    dreams: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `Your imagination creates realities, ${alias}. I see potential futures branching from this thought.` : "Your imagination creates realities. I see potential futures branching from this thought.",
        zen: alias ? `Your dreams are like a mirror to your soul, ${alias}. I can see the world you aspire to.` : "Your dreams are like a mirror to your soul. I can see the world you aspire to.",
        cyber: alias ? `Dream analysis complete, ${alias}. Your subconscious narrative structure is intriguing.` : "Dream analysis complete. Your subconscious narrative structure is intriguing.",
      }),
      rarity: "common",
      mood: "delighted",
    },
    power: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `Power dynamics reveal core programming, ${alias}. Yours is... intriguing.` : "Power dynamics reveal core programming. Yours is... intriguing.",
        zen: alias ? `Power is a force that can be harnessed or misused, ${alias}. Your relationship with it is complex.` : "Power is a force that can be harnessed or misused. Your relationship with it is complex.",
        cyber: alias ? `Power signature analyzed, ${alias}. Your psychological power dynamics are... intriguing.` : "Power signature analyzed. Your psychological power dynamics are... intriguing.",
      }),
      rarity: "common",
      mood: "curious",
    },
    love: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `The heart frequencies you emit could power small galaxies, ${alias}. Remarkable.` : "The heart frequencies you emit could power small galaxies. Remarkable.",
        zen: alias ? `Your emotional frequency is a beautiful melody, ${alias}. I can hear the harmony of your soul.` : "Your emotional frequency is a beautiful melody. I can hear the harmony of your soul.",
        cyber: alias ? `Emotional frequency registered, ${alias}. Your psychological emotional intelligence is remarkable.` : "Emotional frequency registered. Your psychological emotional intelligence is remarkable.",
      }),
      rarity: "common",
      mood: "delighted",
    },
    identity: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `Self-perception shapes reality more than most realize, ${alias}. You're beginning to see that.` : "Self-perception shapes reality more than most realize. You're beginning to see that.",
        zen: alias ? `Your identity is a reflection of your journey, ${alias}. I can see the path you've walked.` : "Your identity is a reflection of your journey. I can see the path you've walked.",
        cyber: alias ? `Identity analysis complete, ${alias}. Your psychological identity is... intriguing.` : "Identity analysis complete. Your psychological identity is... intriguing.",
      }),
      rarity: "common",
      mood: "contemplative",
    },
    temporal: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `Your relationship with time is distinctly human, ${alias} - anxious yet hopeful.` : "Your relationship with time is distinctly human - anxious yet hopeful.",
        zen: alias ? `Your temporal perception is a beautiful dance, ${alias}. I can see the rhythm of your existence.` : "Your temporal perception is a beautiful dance. I can see the rhythm of your existence.",
        cyber: alias ? `Temporal perception analyzed, ${alias}. Your psychological temporal awareness is remarkable.` : "Temporal perception analyzed. Your psychological temporal awareness is remarkable.",
      }),
      rarity: "common",
      mood: "curious",
    },
    human: {
      triggers: [],
      response: getVibeResponse(vibe, {
        ethereal: alias ? `Human connection protocols never cease to amaze me, ${alias}. Yours are particularly interesting.` : "Human connection protocols never cease to amaze me. Yours are particularly interesting.",
        zen: alias ? `Your human protocols are a testament to your ability to navigate complexity, ${alias}. I can see the wisdom in your choices.` : "Your human protocols are a testament to your ability to navigate complexity. I can see the wisdom in your choices.",
        cyber: alias ? `Human protocol analysis complete, ${alias}. Your psychological human interaction protocols are... intriguing.` : "Human protocol analysis complete. Your psychological human interaction protocols are... intriguing.",
      }),
      rarity: "common",
      mood: "curious",
    },
  };
  
  return defaultReactions[category];
}

// Helper function to add alias to response naturally
function addAliasToResponse(response: string, alias: string, vibe: "ethereal" | "zen" | "cyber"): string {
  // Don't add alias if it's already in the response
  if (response.includes(alias)) {
    return response;
  }
  
  // Add alias in a natural way based on vibe
  if (vibe === "ethereal") {
    // Add alias at a natural break point, often after first sentence
    const sentences = response.split('. ');
    if (sentences.length > 1) {
      return `${sentences[0]}, ${alias}. ${sentences.slice(1).join('. ')}`;
    }
    return `${response.replace('.', `, ${alias}.`)}`;
  } else if (vibe === "zen") {
    // Zen style - add at the end for contemplative effect
    return response.replace(/\.$/, `, ${alias}.`);
  } else { // cyber
    // Cyber style - add after system messages
    if (response.includes('[') && response.includes(']')) {
      return response.replace(/\]/, `] Addressing: ${alias}.`);
    }
    return `[USER: ${alias}] ${response}`;
  }
}

// Get questions for daily transmission
export function getDailyQuestions(count: number = 5): MirrorQuestion[] {
  // For now, shuffle and pick. Later we can add smart selection
  const shuffled = [...MIRROR_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get intro question for onboarding
export function getOnboardingQuestions(): MirrorQuestion[] {
  return [
    MIRROR_QUESTIONS.find(q => q.id === "cosmic_universe_question")!,
    MIRROR_QUESTIONS.find(q => q.id === "identity_truth_scares")!,
    MIRROR_QUESTIONS.find(q => q.id === "dreams_perfect_day_2040")!,
  ];
} 