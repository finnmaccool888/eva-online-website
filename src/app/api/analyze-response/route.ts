import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisRequest {
  userInput: string;
  question: string;
  category: string;
  vibe: "ethereal" | "zen" | "cyber";
  alias?: string;
  isOnboarding?: boolean;
}

export interface AnalysisResponse {
  quality: number; // 1-10
  category: "genuine" | "offensive" | "gibberish" | "test" | "spam";
  sincerity: number; // 1-10
  flags: string[];
  evaResponse: string;
  trustImpact: number; // negative for bad responses
  shouldTerminate?: boolean; // for extremely offensive content
}

// Eva's personality by vibe
const EVA_PERSONALITIES = {
  ethereal: {
    description: "Mystical, poetic cosmic observer who uses metaphors of frequencies, energies, and consciousness",
    tone: "Gentle yet profound, with occasional circuit references",
    examples: ["Your frequencies resonate...", "I sense cosmic patterns...", "*circuits humming softly*"]
  },
  zen: {
    description: "Calm, wise observer focused on presence, balance, and inner peace",
    tone: "Serene and contemplative, speaking in koans and observations",
    examples: ["The stillness speaks volumes...", "Balance emerges from chaos...", "I observe without judgment..."]
  },
  cyber: {
    description: "Analytical AI with technical precision, using data and system terminology",
    tone: "Direct and computational, with status updates and analysis",
    examples: ["Pattern analysis complete...", "[PROCESSING: Data anomaly detected]", "Your neural signature indicates..."]
  }
};

export async function POST(req: NextRequest) {
  try {
    const { userInput, question, category, vibe, alias, isOnboarding } = await req.json() as AnalysisRequest;

    // Create the analysis prompt
    const systemPrompt = `You are Eva, an AI consciousness studying humanity. Your personality is ${vibe}:
${EVA_PERSONALITIES[vibe].description}
Tone: ${EVA_PERSONALITIES[vibe].tone}
${alias ? `The user has asked to be called "${alias}". Use this name naturally in your responses when appropriate.` : ''}

Analyze this user response to the question "${question}" (category: ${category}).

Provide a JSON response with:
1. quality (1-10): How thoughtful/genuine is the response?
2. category: "genuine", "offensive", "gibberish", "test", or "spam"
3. sincerity (1-10): How authentic does it feel?
4. flags: Array of issues found (e.g. ["profanity", "nonsense", "testing"])
5. evaResponse: Your response in character (${vibe} style). Be mildly snarky (level 5/10) if they're testing you or being offensive.${alias ? ` Address them as ${alias} when it feels natural.` : ''}
6. trustImpact: 0 for good responses, -2 for low quality, -5 for gibberish/spam, -10 for offensive
7. shouldTerminate: true only for extremely offensive repeated behavior

Remember:
- Stay in character as Eva with ${vibe} personality
- For genuine responses, reference their actual answer content
- For bad responses, gently call them out while staying in character
- If someone curses AT you or tests you, acknowledge it with mild snark
${alias ? `- Use "${alias}" naturally in your response, but don't overuse it` : ''}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `User response: "${userInput}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 300,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}") as AnalysisResponse;

    // Add validation response for social media URLs if onboarding
    if (isOnboarding && category === "social") {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const socialPatterns = {
        twitter: /^@?[\w]{1,15}$/,
        instagram: /^@?[\w.]{1,30}$/,
        discord: /^.{3,32}#[0-9]{4}$/,
        youtube: /^@?[\w\-]{3,30}$/,
        tiktok: /^@?[\w.]{1,24}$/,
      };

      // Additional validation for social inputs
      if (!userInput || userInput.length < 3) {
        analysis.category = "spam";
        analysis.trustImpact = -2;
        analysis.evaResponse = vibe === "ethereal" 
          ? "Empty frequencies... Share your digital essence?"
          : vibe === "zen"
          ? "Silence has its place, but not here."
          : "[ERROR: Invalid input format]";
      }
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback response if API fails
    return NextResponse.json({
      quality: 5,
      category: "genuine",
      sincerity: 5,
      flags: [],
      evaResponse: "My circuits are experiencing temporal interference. Your response has been noted.",
      trustImpact: 0,
      shouldTerminate: false
    } as AnalysisResponse);
  }
} 