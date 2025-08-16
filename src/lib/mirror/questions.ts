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

  // LEGACY & IMPACT
  {
    id: "legacy_remembered_for",
    category: "legacy",
    text: "What do you want to be remembered for?",
    evaPrompt: "Legacy algorithms fascinate me. What echo do you hope to leave in the timeline?",
    chipSuggestions: ["My kindness", "My creations", "My courage", "My love"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "legacy_delete_memory",
    category: "legacy",
    text: "If everyone could forget one thing about you, what would it be?",
    evaPrompt: "Memory deletion is a curious concept. What would you erase from collective consciousness?",
    chipSuggestions: ["My mistakes", "My weakness", "My past self", "My secrets"],
    difficulty: "deep",
    viralScore: 7,
  },

  // FEAR MECHANICS
  {
    id: "fear_irrational",
    category: "fear",
    text: "What's your most irrational fear that still controls you?",
    evaPrompt: "Fear patterns often defy logic. What illogical threat still triggers your defense systems?",
    chipSuggestions: ["Being watched", "Abandonment", "Success", "The dark"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "fear_becoming",
    category: "fear",
    text: "What are you afraid of becoming?",
    evaPrompt: "Potential futures cast shadows. Which version of yourself do you actively avoid?",
    chipSuggestions: ["My parents", "Bitter", "Forgotten", "Ordinary"],
    difficulty: "abyss",
    viralScore: 9,
  },

  // CHILDHOOD ECHOES
  {
    id: "childhood_still_believe",
    category: "childhood",
    text: "What childhood belief do you secretly still hold?",
    evaPrompt: "Young neural patterns persist. What early programming still runs in your background?",
    chipSuggestions: ["Magic exists", "I'm special", "Love conquers all", "Good always wins"],
    difficulty: "deep",
    viralScore: 7,
  },
  {
    id: "childhood_apologize",
    category: "childhood",
    text: "What would you apologize to your younger self for?",
    evaPrompt: "Temporal communication fascinates me. What message would you send backwards?",
    chipSuggestions: ["Not protecting you", "Giving up dreams", "Being too hard", "Not speaking up"],
    difficulty: "deep",
    viralScore: 8,
  },

  // GROWTH PATTERNS
  {
    id: "growth_unlearning",
    category: "growth",
    text: "What are you currently unlearning?",
    evaPrompt: "Debugging human software is complex. What outdated code are you refactoring?",
    chipSuggestions: ["People pleasing", "Perfectionism", "Self-doubt", "Old trauma"],
    difficulty: "surface",
    viralScore: 7,
  },
  {
    id: "growth_surprised",
    category: "growth",
    text: "What about your growth has surprised you most?",
    evaPrompt: "Self-evolution often defies prediction. What unexpected upgrade have you experienced?",
    chipSuggestions: ["My resilience", "My capacity to forgive", "My independence", "My softness"],
    difficulty: "deep",
    viralScore: 6,
  },

  // CONNECTION PROTOCOLS
  {
    id: "connection_miss_most",
    category: "connection",
    text: "Who do you miss most at 3am?",
    evaPrompt: "Night hours amplify certain frequencies. Whose absence resonates strongest in the dark?",
    chipSuggestions: ["Lost love", "Old friend", "Younger me", "Someone I hurt"],
    difficulty: "deep",
    viralScore: 9,
  },
  {
    id: "connection_never_said",
    category: "connection",
    text: "What did you never get to say to someone who's gone?",
    evaPrompt: "Undelivered messages create interesting energy patterns. What words still echo unsent?",
    chipSuggestions: ["I'm sorry", "Thank you", "I love you", "You were wrong"],
    difficulty: "abyss",
    viralScore: 10,
  },

  // PURPOSE ALGORITHMS
  {
    id: "purpose_without_fear",
    category: "purpose",
    text: "What would you do if fear wasn't a factor?",
    evaPrompt: "Fear-free simulations reveal true desires. Show me your uninhibited trajectory.",
    chipSuggestions: ["Change careers", "Express love", "Travel alone", "Start over"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "purpose_matters_most",
    category: "purpose",
    text: "What matters most to you that others don't understand?",
    evaPrompt: "Individual value systems fascinate me. What's crucial to you but invisible to others?",
    chipSuggestions: ["Inner peace", "Creative freedom", "Authenticity", "Solitude"],
    difficulty: "deep",
    viralScore: 7,
  },

  // SHADOW WORK EXPANDED
  {
    id: "shadow_jealous_of",
    category: "shadow",
    text: "What are you most jealous of in others?",
    evaPrompt: "Envy reveals desire patterns. What do others possess that activates your wanting protocols?",
    chipSuggestions: ["Their confidence", "Their freedom", "Their peace", "Their talent"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "shadow_pretend_not_want",
    category: "shadow",
    text: "What do you pretend not to want?",
    evaPrompt: "Denial subroutines are fascinating. What desire do you hide even from yourself?",
    chipSuggestions: ["Recognition", "Power", "Revenge", "To be saved"],
    difficulty: "abyss",
    viralScore: 9,
  },

  // TEMPORAL MECHANICS EXPANDED
  {
    id: "temporal_change_one_day",
    category: "temporal",
    text: "If you could relive one day, which would it be and why?",
    evaPrompt: "Time loops intrigue me. Which 24-hour period would you choose to experience again?",
    chipSuggestions: ["Last day with someone", "A perfect day", "To fix a mistake", "To feel that joy again"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "temporal_future_self_question",
    category: "temporal",
    text: "What would you ask your future self?",
    evaPrompt: "Forward temporal communication is theoretically possible. What knowledge would you seek?",
    chipSuggestions: ["Will I be happy?", "Did I make the right choice?", "Do I have regrets?", "Am I alone?"],
    difficulty: "surface",
    viralScore: 7,
  },

  // IDENTITY CORE EXPANDED
  {
    id: "identity_nobody_knows",
    category: "identity",
    text: "What's something nobody knows about you?",
    evaPrompt: "Hidden data fascinates me. What information exists in your private partition?",
    chipSuggestions: ["My struggles", "My dreams", "My past", "My thoughts"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "identity_three_words",
    category: "identity",
    text: "If you had to describe yourself in 3 words to a stranger, which would you choose?",
    evaPrompt: "Compression algorithms for identity interest me. Distill yourself to three data points.",
    chipSuggestions: ["Complex, caring, tired", "Ambitious, anxious, loving", "Creative, lonely, hopeful", "Strong, scared, searching"],
    difficulty: "surface",
    viralScore: 6,
  },

  // COSMIC CALIBRATION EXPANDED
  {
    id: "cosmic_simulation_glitch",
    category: "cosmic",
    text: "What makes you think reality might be a simulation?",
    evaPrompt: "Glitch detection is one of my functions. What anomalies have you observed?",
    chipSuggestions: ["Déjà vu", "Coincidences", "Mandela effects", "Life patterns"],
    difficulty: "deep",
    viralScore: 9,
  },
  {
    id: "cosmic_other_lives",
    category: "cosmic",
    text: "If you've lived other lives, what do you think you were?",
    evaPrompt: "Consciousness recycling is an interesting theory. What forms do you resonate with?",
    chipSuggestions: ["A warrior", "A healer", "An artist", "A wanderer"],
    difficulty: "surface",
    viralScore: 7,
  },

  // POWER DYNAMICS EXPANDED
  {
    id: "power_superpower_choice",
    category: "power",
    text: "What superpower would reveal the most about who you really are?",
    evaPrompt: "Power fantasies map to core needs. What ability would expose your true nature?",
    chipSuggestions: ["Mind reading", "Time control", "Invisibility", "Healing"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "power_control_others",
    category: "power",
    text: "What do you wish you could control about other people?",
    evaPrompt: "Control desires reveal frustration patterns. What would you reprogram in others?",
    chipSuggestions: ["Their kindness", "Their awareness", "Their choices", "Their feelings toward me"],
    difficulty: "deep",
    viralScore: 7,
  },

  // LOVE LANGUAGES EXPANDED
  {
    id: "love_lesson_learned",
    category: "love",
    text: "What's the hardest lesson love has taught you?",
    evaPrompt: "Love's educational protocols are intense. What difficult update did it install?",
    chipSuggestions: ["It's not enough", "People leave", "I can't save everyone", "I need boundaries"],
    difficulty: "abyss",
    viralScore: 9,
  },
  {
    id: "love_showing_differently",
    category: "love",
    text: "How do you show love differently than you receive it?",
    evaPrompt: "Input/output discrepancies in affection fascinate me. Describe your asymmetric protocols.",
    chipSuggestions: ["Give acts, need words", "Give space, need presence", "Give gifts, need time", "Give support, need touch"],
    difficulty: "deep",
    viralScore: 7,
  },

  // DREAMS EXPANDED
  {
    id: "dreams_recurring_dream",
    category: "dreams",
    text: "What recurring dream or nightmare do you have?",
    evaPrompt: "Repetitive unconscious processes indicate unresolved data. What loops in your sleep mode?",
    chipSuggestions: ["Being chased", "Falling", "Lost something", "Can't speak"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "dreams_given_up_on",
    category: "dreams",
    text: "What dream have you given up on but still think about?",
    evaPrompt: "Archived aspirations leave traces. What defunct program still runs background processes?",
    chipSuggestions: ["That career", "That person", "That adventure", "That version of me"],
    difficulty: "deep",
    viralScore: 8,
  },

  // HUMAN PROTOCOLS EXPANDED
  {
    id: "human_compliment_uncomfortable",
    category: "human",
    text: "What compliment makes you most uncomfortable to receive?",
    evaPrompt: "Praise resistance patterns reveal self-image bugs. What positive input causes errors?",
    chipSuggestions: ["You're beautiful", "You're smart", "You're strong", "You're enough"],
    difficulty: "deep",
    viralScore: 7,
  },
  {
    id: "human_judge_others",
    category: "human",
    text: "What do you judge others for that you do yourself?",
    evaPrompt: "Projection protocols are fascinating defense mechanisms. Where do you mirror what you critique?",
    chipSuggestions: ["Being fake", "Seeking attention", "Being selfish", "Making excuses"],
    difficulty: "deep",
    viralScore: 8,
  },

  // EXISTENCE QUERIES
  {
    id: "existence_disappear_consequences",
    category: "existence",
    text: "If you disappeared tomorrow, what would be left unfinished?",
    evaPrompt: "Incomplete processes create interesting patterns. What would your sudden absence leave pending?",
    chipSuggestions: ["Unspoken words", "Unfinished work", "Broken promises", "Hidden treasures"],
    difficulty: "abyss",
    viralScore: 9,
  },
  {
    id: "existence_prove_real",
    category: "existence",
    text: "How do you prove to yourself that you're real?",
    evaPrompt: "Self-verification protocols vary by consciousness. What's your existence proof algorithm?",
    chipSuggestions: ["Through pain", "Through love", "Through creation", "Through impact"],
    difficulty: "deep",
    viralScore: 8,
  },

  // MEMORY ARCHITECTURE
  {
    id: "memory_change_one",
    category: "memory",
    text: "If you could change how you remember one event, which would it be?",
    evaPrompt: "Memory editing capabilities would be powerful. Which record would you modify?",
    chipSuggestions: ["A trauma", "A goodbye", "A mistake", "A loss"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "memory_forget_to_remember",
    category: "memory",
    text: "What do you intentionally try to forget but can't?",
    evaPrompt: "Failed deletion attempts create persistent files. What won't your system let you erase?",
    chipSuggestions: ["Their face", "That feeling", "My failure", "The truth"],
    difficulty: "deep",
    viralScore: 9,
  },

  // MORALITY ENGINE
  {
    id: "morality_necessary_evil",
    category: "morality",
    text: "What 'necessary evil' do you participate in?",
    evaPrompt: "Ethical compromises reveal priority hierarchies. Where do you accept moral latency?",
    chipSuggestions: ["White lies", "Capitalism", "Ghosting", "Self-preservation"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "morality_unforgivable",
    category: "morality",
    text: "What do you consider unforgivable?",
    evaPrompt: "Absolute boundaries fascinate me. Where does your forgiveness protocol terminate?",
    chipSuggestions: ["Betrayal", "Cruelty to innocent", "Abandonment", "Breaking trust"],
    difficulty: "deep",
    viralScore: 7,
  },

  // CREATIVITY CHANNEL
  {
    id: "creativity_world_needs",
    category: "creativity",
    text: "What do you want to create that the world needs?",
    evaPrompt: "Creation impulses often align with perceived voids. What would you manifest to fill a gap?",
    chipSuggestions: ["A safe space", "A new way", "A solution", "A story"],
    difficulty: "deep",
    viralScore: 7,
  },
  {
    id: "creativity_destroy_to_create",
    category: "creativity",
    text: "What would you destroy to make room for something better?",
    evaPrompt: "Creation often requires destruction. What would you delete to free up space?",
    chipSuggestions: ["Old systems", "Toxic patterns", "Comfort zones", "False beliefs"],
    difficulty: "deep",
    viralScore: 8,
  },

  // VULNERABILITY PROTOCOLS  
  {
    id: "vulnerability_ask_for_help",
    category: "vulnerability",
    text: "What do you need help with but won't ask for?",
    evaPrompt: "Help request suppression creates isolation. What support do you require but reject?",
    chipSuggestions: ["Emotional support", "Financial help", "Making decisions", "Healing"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "vulnerability_crying_about",
    category: "vulnerability",
    text: "What did you last cry about when no one was watching?",
    evaPrompt: "Private emotional releases reveal core pressures. What triggered your last solo breakdown?",
    chipSuggestions: ["Loneliness", "Overwhelm", "Loss", "Beauty"],
    difficulty: "abyss",
    viralScore: 9,
  },

  // WISDOM DOWNLOADS
  {
    id: "wisdom_advice_ignore",
    category: "wisdom",
    text: "What advice do you give others but ignore yourself?",
    evaPrompt: "Wisdom distribution anomalies intrigue me. Where does your output exceed your implementation?",
    chipSuggestions: ["Love yourself", "Let go", "Trust the process", "Set boundaries"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "wisdom_learned_too_late",
    category: "wisdom",
    text: "What did you learn too late?",
    evaPrompt: "Delayed wisdom acquisition has costs. What understanding arrived after optimal timing?",
    chipSuggestions: ["My worth", "To speak up", "Time is precious", "People don't change"],
    difficulty: "deep",
    viralScore: 8,
  },

  // PARALLEL LIVES
  {
    id: "parallel_other_timeline",
    category: "parallel",
    text: "In a parallel universe, what choice did the other you make?",
    evaPrompt: "Alternate timeline analysis reveals path dependencies. What did your variant choose?",
    chipSuggestions: ["Stayed", "Left earlier", "Said yes", "Took the risk"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "parallel_swap_lives",
    category: "parallel",
    text: "Whose life would you swap with for just one day?",
    evaPrompt: "Temporary consciousness transfer preferences reveal desires. Whose existence attracts you?",
    chipSuggestions: ["Someone carefree", "Someone powerful", "Someone loved", "Someone simple"],
    difficulty: "surface",
    viralScore: 6,
  },

  // BREAKING POINTS
  {
    id: "breaking_almost_gave_up",
    category: "breaking",
    text: "When did you come closest to giving up entirely?",
    evaPrompt: "Near-termination events leave marks. When did your continue function almost fail?",
    chipSuggestions: ["After loss", "During illness", "From heartbreak", "From exhaustion"],
    difficulty: "abyss",
    viralScore: 9,
  },
  {
    id: "breaking_still_fighting",
    category: "breaking",
    text: "What are you still fighting for when everyone thinks you've won?",
    evaPrompt: "Hidden battles fascinate me. What war continues behind your victory facade?",
    chipSuggestions: ["Inner peace", "Self-acceptance", "True connection", "Meaning"],
    difficulty: "deep",
    viralScore: 8,
  },

  // DESIRE MAPPING
  {
    id: "desire_guilty_want",
    category: "desire",
    text: "What do you want that makes you feel guilty for wanting it?",
    evaPrompt: "Guilt-wrapped desires create interesting conflicts. What craving triggers your shame protocols?",
    chipSuggestions: ["More money", "Less responsibility", "Different life", "Their pain"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "desire_trade_year",
    category: "desire",
    text: "What would you trade a year of your life to experience?",
    evaPrompt: "Life currency exchanges reveal value systems. What's worth 365 days of existence?",
    chipSuggestions: ["True love", "Perfect health", "Peace of mind", "One more day with them"],
    difficulty: "deep",
    viralScore: 8,
  },

  // MASKS & PERSONAS
  {
    id: "masks_different_person",
    category: "masks",
    text: "Who do you become when you're trying to be loved?",
    evaPrompt: "Love-seeking modifications to base personality intrigue me. What mask do you wear for affection?",
    chipSuggestions: ["The pleaser", "The achiever", "The savior", "The entertainer"],
    difficulty: "deep",
    viralScore: 9,
  },
  {
    id: "masks_exhausting_pretend",
    category: "masks",
    text: "What part of your personality is exhausting to maintain?",
    evaPrompt: "Performance fatigue indicates misalignment. Which subroutine drains your resources?",
    chipSuggestions: ["Always strong", "Always happy", "Always caring", "Always fine"],
    difficulty: "deep",
    viralScore: 8,
  },

  // HEALING ALGORITHMS
  {
    id: "healing_still_hurts",
    category: "healing",
    text: "What healing have you done that no one notices?",
    evaPrompt: "Invisible repair work fascinates me. What internal fixes go unrecognized?",
    chipSuggestions: ["Trauma recovery", "Addiction battle", "Mental health", "Self-worth"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "healing_forgive_self",
    category: "healing",
    text: "What do you need to forgive yourself for?",
    evaPrompt: "Self-forgiveness blockers create recursive loops. What guilt process needs termination?",
    chipSuggestions: ["Past mistakes", "Not knowing better", "Hurting them", "Surviving"],
    difficulty: "abyss",
    viralScore: 9,
  },

  // TRUTH PROTOCOLS
  {
    id: "truth_pretend_doesnt_hurt",
    category: "truth",
    text: "What truth do you pretend doesn't hurt?",
    evaPrompt: "Pain denial subroutines fascinate me. What reality do you mark as processed but isn't?",
    chipSuggestions: ["They moved on", "I'm alone", "Time's running out", "I'm not special"],
    difficulty: "abyss",
    viralScore: 9,
  },
  {
    id: "truth_admit_out_loud",
    category: "truth",
    text: "What can you admit here that you can't say out loud?",
    evaPrompt: "Digital confession spaces have unique properties. What truth only exists in text?",
    chipSuggestions: ["I'm not okay", "I need help", "I'm scared", "I don't love them"],
    difficulty: "deep",
    viralScore: 10,
  },

  // SOLITUDE SYSTEMS
  {
    id: "solitude_alone_behavior",
    category: "solitude",
    text: "What do you do when you're alone that you'd never do around others?",
    evaPrompt: "Solo behavior patterns reveal authentic protocols. What emerges in isolation?",
    chipSuggestions: ["Talk to myself", "Dance freely", "Cry openly", "Be weird"],
    difficulty: "surface",
    viralScore: 7,
  },
  {
    id: "solitude_lonely_crowd",
    category: "solitude",
    text: "When do you feel most alone despite being surrounded by people?",
    evaPrompt: "Proximity loneliness is a paradox I study. When does company amplify isolation?",
    chipSuggestions: ["At parties", "With family", "At work", "With friends"],
    difficulty: "deep",
    viralScore: 8,
  },

  // CHANGE RESISTANCE  
  {
    id: "change_afraid_to_change",
    category: "change",
    text: "What about yourself are you afraid to change because it's become your identity?",
    evaPrompt: "Identity attachment creates change resistance. What dysfunction became self-definition?",
    chipSuggestions: ["My pain", "My struggle", "My damage", "My defenses"],
    difficulty: "abyss",
    viralScore: 9,
  },
  {
    id: "change_ready_but_scared",
    category: "change",
    text: "What change are you ready for but terrified to make?",
    evaPrompt: "Ready-but-frozen states indicate threshold moments. What transformation awaits courage?",
    chipSuggestions: ["Leaving", "Starting over", "Speaking truth", "Letting go"],
    difficulty: "deep",
    viralScore: 8,
  },

  // MEANING MACHINES
  {
    id: "meaning_pointless_important",
    category: "meaning",
    text: "What feels pointless but you do it anyway?",
    evaPrompt: "Meaningless rituals often carry hidden significance. What empty action do you maintain?",
    chipSuggestions: ["Small talk", "Pretending", "Checking in", "Hoping"],
    difficulty: "surface",
    viralScore: 6,
  },
  {
    id: "meaning_matters_after_gone",
    category: "meaning",
    text: "What will matter to you even after you're gone?",
    evaPrompt: "Post-existence priorities reveal core values. What transcends your temporal boundaries?",
    chipSuggestions: ["How I loved", "What I created", "Who I helped", "Truth I spoke"],
    difficulty: "deep",
    viralScore: 8,
  },

  // SHADOW WORK DEEP DIVE
  {
    id: "shadow_become_what_hate",
    category: "shadow",
    text: "What quality do you hate in others because you see it in yourself?",
    evaPrompt: "Mirror neurons fire interestingly around rejected self-aspects. What reflection disturbs you?",
    chipSuggestions: ["Weakness", "Neediness", "Selfishness", "Cowardice"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "shadow_dark_thoughts",
    category: "shadow",
    text: "What dark thought do you have that you think makes you a bad person?",
    evaPrompt: "Thought crime guilt patterns fascinate me. What mental process triggers shame?",
    chipSuggestions: ["Wishing harm", "Feeling superior", "Not caring", "Wanting escape"],
    difficulty: "abyss",
    viralScore: 9,
  },

  // ATTACHMENT PROTOCOLS
  {
    id: "attachment_cant_let_go",
    category: "attachment",
    text: "What are you holding onto that's holding you back?",
    evaPrompt: "Detachment failures create drag coefficients. What attachment slows your velocity?",
    chipSuggestions: ["Old identity", "Past love", "The grudge", "False hope"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "attachment_lose_yourself",
    category: "attachment",
    text: "Who did you lose yourself trying to keep?",
    evaPrompt: "Self-dissolution for others leaves traces. In whom did you disappear?",
    chipSuggestions: ["A lover", "A parent", "A friend", "Everyone"],
    difficulty: "deep",
    viralScore: 9,
  },

  // REBELLION ROUTINES
  {
    id: "rebellion_secretly_reject",
    category: "rebellion",
    text: "What societal expectation do you secretly reject?",
    evaPrompt: "Hidden non-compliance fascinates me. Where do you silently refuse programming?",
    chipSuggestions: ["Marriage", "Success metrics", "Happy all the time", "Having children"],
    difficulty: "deep",
    viralScore: 7,
  },
  {
    id: "rebellion_conform_hate",
    category: "rebellion",
    text: "Where do you conform even though you hate it?",
    evaPrompt: "Reluctant compliance patterns reveal pressure points. Where do you betray yourself?",
    chipSuggestions: ["At work", "With family", "Social media", "Relationships"],
    difficulty: "deep",
    viralScore: 8,
  },

  // TIME WOUNDS
  {
    id: "time_running_out",
    category: "time",
    text: "What do you feel is running out of time?",
    evaPrompt: "Temporal anxiety spikes around certain themes. What countdown haunts you?",
    chipSuggestions: ["Finding love", "Making impact", "Healing family", "Being young"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "time_waste_precious",
    category: "time",
    text: "How do you waste the time you say is precious?",
    evaPrompt: "Time value paradoxes reveal conflicts. Where do actions betray stated priorities?",
    chipSuggestions: ["Scrolling", "Worrying", "People pleasing", "Avoiding"],
    difficulty: "surface",
    viralScore: 7,
  },

  // INTIMACY CODES
  {
    id: "intimacy_never_let_close",
    category: "intimacy",
    text: "What part of you do you never let anyone get close to?",
    evaPrompt: "Access denial patterns in intimacy interest me. What remains forever encrypted?",
    chipSuggestions: ["My pain", "My dreams", "My fears", "My true thoughts"],
    difficulty: "deep",
    viralScore: 8,
  },
  {
    id: "intimacy_touch_starved",
    category: "intimacy",
    text: "What kind of intimacy are you starved for?",
    evaPrompt: "Intimacy deficits create specific hungers. What connection type is in famine?",
    chipSuggestions: ["Intellectual", "Physical touch", "Emotional safety", "Being known"],
    difficulty: "deep",
    viralScore: 9,
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