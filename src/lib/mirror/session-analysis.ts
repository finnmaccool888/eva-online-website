import { UserProfile } from "./types";

export interface SessionData {
  questionId: string;
  questionText: string;
  answer: string;
  editedAt?: number;
  // Add original scores for comparison
  originalQuality?: number;
  originalSincerity?: number;
  originalPoints?: number;
}

export interface AnalysisResult {
  quality: number;
  category: string;
  sincerity: number;
  flags: string[];
  trustImpact: number;
  shouldTerminate: boolean;
  evaResponse?: string;
  reasoning?: string; // New field for scoring explanation
  pointsAwarded?: number; // Points calculated by the API
}

export interface ScoreComparison {
  questionId: string;
  original: {
    quality: number;
    sincerity: number;
    points: number;
  };
  new: {
    quality: number;
    sincerity: number;
    points: number;
  };
  change: {
    quality: number;
    sincerity: number;
    points: number;
  };
  reasoning?: string;
}

// Re-analyze edited answers and calculate new session scores
export async function reAnalyzeSession(
  sessionData: SessionData[],
  sessionIndex: number,
  originalSession?: any // Pass original session for comparison
): Promise<{
  humanScore: number;
  pointsEarned: number;
  totalQuestionsAnswered: number;
  scoreComparisons: ScoreComparison[];
  overallImprovement: {
    qualityChange: number;
    sincerityChange: number;
    pointsChange: number;
  };
}> {
  console.log(`[SessionAnalysis] Re-analyzing session ${sessionIndex} with ${sessionData.length} answers`);
  
  let totalQuality = 0;
  let totalSincerity = 0;
  let validAnswers = 0;
  let totalPoints = 0;
  const scoreComparisons: ScoreComparison[] = [];
  
  let originalTotalQuality = 0;
  let originalTotalSincerity = 0;
  let originalTotalPoints = 0;

  // Re-analyze each answer
  for (let i = 0; i < sessionData.length; i++) {
    const item = sessionData[i];
    
    try {
      console.log(`[SessionAnalysis] Analyzing answer for question ${item.questionId}`);
      
      // Call the analysis API for each edited answer
      const response = await fetch('/api/analyze-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: item.answer,
          question: item.questionText || "Edited answer",
          category: "edited",
          vibe: "ethereal", // Use ethereal for edited responses
          alias: null,
          isOnboarding: false
        })
      });

      if (!response.ok) {
        console.error(`[SessionAnalysis] Analysis failed for question ${item.questionId}`);
        continue;
      }

      const analysis: AnalysisResult = await response.json();
      
      // Count valid answers (not spam/gibberish)
      if (analysis.category !== 'spam' && analysis.category !== 'gibberish') {
        totalQuality += analysis.quality;
        totalSincerity += analysis.sincerity;
        validAnswers++;
        
        // Use points awarded by the API instead of recalculating
        const questionPoints = analysis.pointsAwarded || calculateQuestionPoints(analysis.quality, analysis.sincerity);
        totalPoints += questionPoints;
        
        // Get original scores for comparison
        const originalQuality = item.originalQuality || (originalSession?.sessionData?.[i]?.quality || 5);
        const originalSincerity = item.originalSincerity || (originalSession?.sessionData?.[i]?.sincerity || 5);
        // Use consistent point calculation - prefer API calculation format when available
        const originalPoints = item.originalPoints || ((originalQuality + originalSincerity) * 25);
        
        originalTotalQuality += originalQuality;
        originalTotalSincerity += originalSincerity;
        originalTotalPoints += originalPoints;
        
        // Track comparison
        scoreComparisons.push({
          questionId: item.questionId,
          original: {
            quality: originalQuality,
            sincerity: originalSincerity,
            points: originalPoints
          },
          new: {
            quality: analysis.quality,
            sincerity: analysis.sincerity,
            points: questionPoints
          },
          change: {
            quality: analysis.quality - originalQuality,
            sincerity: analysis.sincerity - originalSincerity,
            points: questionPoints - originalPoints
          },
          reasoning: analysis.reasoning
        });
      }
      
      console.log(`[SessionAnalysis] Question ${item.questionId}:`, {
        quality: analysis.quality,
        sincerity: analysis.sincerity,
        points: totalPoints,
        reasoning: analysis.reasoning
      });
      
    } catch (error) {
      console.error(`[SessionAnalysis] Error analyzing question ${item.questionId}:`, error);
      // For errors, assume minimum valid answer
      validAnswers++;
      totalQuality += 5;
      totalSincerity += 5;
      totalPoints += 250; // Minimum points for valid answer
      
      originalTotalQuality += 5;
      originalTotalSincerity += 5;
      originalTotalPoints += 250;
    }
  }

  // Calculate final scores
  const humanScore = validAnswers > 0 ? Math.round((totalQuality + totalSincerity) / (validAnswers * 2)) : 0;
  const originalHumanScore = validAnswers > 0 ? Math.round((originalTotalQuality + originalTotalSincerity) / (validAnswers * 2)) : 0;
  
  const overallImprovement = {
    qualityChange: totalQuality - originalTotalQuality,
    sincerityChange: totalSincerity - originalTotalSincerity,
    pointsChange: totalPoints - originalTotalPoints
  };
  
  console.log(`[SessionAnalysis] Session ${sessionIndex} results:`, {
    humanScore,
    originalHumanScore,
    pointsEarned: totalPoints,
    originalPoints: originalTotalPoints,
    totalQuestionsAnswered: sessionData.length,
    validAnswers,
    overallImprovement,
    scoreComparisons
  });

  return {
    humanScore: Math.min(100, Math.max(0, humanScore)), // Clamp between 0-100
    pointsEarned: totalPoints,
    totalQuestionsAnswered: sessionData.length,
    scoreComparisons,
    overallImprovement
  };
}

// Improved point calculation with clear logic
function calculateQuestionPoints(quality: number, sincerity: number): number {
  const avgScore = (quality + sincerity) / 2;
  
  // Transparent point calculation:
  // 9-10: 500 points (exceptional)
  // 7-8: 400 points (good)
  // 5-6: 300 points (decent)
  // 3-4: 200 points (minimal)
  // 1-2: 100 points (poor)
  
  if (avgScore >= 9) return 500;
  if (avgScore >= 7) return 400;
  if (avgScore >= 5) return 300;
  if (avgScore >= 3) return 200;
  return 100;
}

// Update profile with recalculated session data
export function updateProfileWithNewSessionData(
  profile: UserProfile,
  sessionIndex: number,
  newSessionData: {
    humanScore: number;
    pointsEarned: number;
    totalQuestionsAnswered: number;
  }
): UserProfile {
  const updatedProfile = { ...profile };

  if (!updatedProfile.sessionHistory || !updatedProfile.sessionHistory[sessionIndex]) {
    console.error(`[SessionAnalysis] Session ${sessionIndex} not found in profile`);
    return updatedProfile;
  }

  // Update the specific session
  updatedProfile.sessionHistory[sessionIndex] = {
    ...updatedProfile.sessionHistory[sessionIndex],
    humanScore: newSessionData.humanScore,
    pointsEarned: newSessionData.pointsEarned,
    questionsAnswered: newSessionData.totalQuestionsAnswered
  };

  // Recalculate profile totals
  const allSessions = updatedProfile.sessionHistory;
  const totalSessions = allSessions.length;
  
  if (totalSessions > 0) {
    // Recalculate average human score
    const avgHumanScore = allSessions.reduce((sum, session) => sum + session.humanScore, 0) / totalSessions;
    updatedProfile.humanScore = Math.round(avgHumanScore);
    
    // Recalculate total questions answered
    updatedProfile.totalQuestionsAnswered = allSessions.reduce((sum, session) => sum + session.questionsAnswered, 0);
  }

  updatedProfile.updatedAt = Date.now();
  
  console.log(`[SessionAnalysis] Updated profile totals:`, {
    humanScore: updatedProfile.humanScore,
    totalQuestions: updatedProfile.totalQuestionsAnswered,
    sessionCount: totalSessions
  });

  return updatedProfile;
} 