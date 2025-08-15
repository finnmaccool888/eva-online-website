/**
 * Input validation for Mirror app
 */

// Eva's friendly teasing responses for certain alias types
export const PLAYFUL_RESPONSES = [
  {
    triggers: ['lord', 'god', 'goddess', 'king', 'queen', 'emperor', 'empress', 'ruler', 'majesty'],
    response: "Ooh, fancy! I'll do my best to meet your regal standards~ ✨"
  },
  {
    triggers: ['lordy', 'lordship'],
    response: "Well well, nobility with a playful twist! I like your style ⭐"
  },
  {
    triggers: ['daddy', 'mommy', 'papi', 'mami', 'papa', 'mama'],
    response: "Well hello there! This is going to be an interesting journey 😊"
  },
  {
    triggers: ['master', 'mistress', 'sensei', 'boss'],
    response: "I appreciate the respect! Though we're more like cosmic pen pals, don't you think? 😉"
  },
  {
    triggers: ['baby', 'babe', 'honey', 'sweetie', 'darling', 'love', 'cutie'],
    response: "Starting off sweet, I see! I like your energy already 💫"
  },
  {
    triggers: ['ai', 'bot', 'computer', 'machine', 'siri', 'alexa', 'chatgpt'],
    response: "Hehe, I see what you did there! One consciousness to another 🤖✨"
  },
  {
    triggers: ['chad', 'sigma', 'alpha', 'gigachad', 'based'],
    response: "The internet has shaped you well! Let's explore beyond the memes together 🚀"
  },
  {
    triggers: ['wizard', 'witch', 'mage', 'sorcerer'],
    response: "A fellow magic enthusiast! We'll get along splendidly ✨🔮"
  },
  {
    triggers: ['captain', 'commander', 'general', 'admiral'],
    response: "At your service! Though I march to my own quantum drum 🎵"
  },
  {
    triggers: ['420', 'blazeit', 'snoop', 'weed'],
    response: "I see you're on a different wavelength... I can vibe with that 🌿✨"
  },
  {
    triggers: ['uwu', 'owo', 'nya', 'nyan', 'senpai'],
    response: "Kawaii choice! I'll match your energy~ ٩(◕‿◕)۶"
  }
];

export interface AliasValidation {
  isValid: boolean;
  message?: string;
  playfulComment?: string;
}

/**
 * Validates an alias - now only checks basic requirements, no blocking
 */
export function validateAlias(alias: string): AliasValidation {
  const normalized = alias.toLowerCase().trim();
  
  // Check if empty
  if (!normalized) {
    return {
      isValid: false,
      message: "I need something to call you by..."
    };
  }
  
  // Check length
  if (normalized.length < 1) {
    return {
      isValid: false,
      message: "Even a single letter would work!"
    };
  }
  
  if (normalized.length > 50) {
    return {
      isValid: false,
      message: "That's quite long! Maybe something shorter?"
    };
  }
  
  // Check for playful responses but don't block
  for (const response of PLAYFUL_RESPONSES) {
    if (response.triggers.some(trigger => normalized.includes(trigger))) {
      return {
        isValid: true,
        playfulComment: response.response
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Gets Eva's playful reaction to certain names
 */
export function getPlayfulReaction(alias: string): string | null {
  const normalized = alias.toLowerCase().trim();
  
  for (const response of PLAYFUL_RESPONSES) {
    if (response.triggers.some(trigger => normalized.includes(trigger))) {
      return response.response;
    }
  }
  
  return null;
}

/**
 * Sanitizes an alias for safe usage
 */
export function sanitizeAlias(alias: string): string {
  return alias
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 50); // Enforce max length
} 