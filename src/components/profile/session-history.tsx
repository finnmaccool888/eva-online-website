"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserProfile } from "@/lib/mirror/types";
import { Calendar, Edit3, Star, TrendingUp, ChevronRight, Info } from "lucide-react";
import EditSessionDialog from "./edit-session-dialog";
import ScoringExplanation from "./scoring-explanation";
import { saveProfile, updateProfilePoints } from "@/lib/mirror/profile";
import { reAnalyzeSession, updateProfileWithNewSessionData } from "@/lib/mirror/session-analysis";

interface SessionHistoryProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export default function SessionHistory({ profile, onUpdateProfile }: SessionHistoryProps) {
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSessionIndex, setEditingSessionIndex] = useState<number | null>(null);
  const [scoringExplanationOpen, setScoringExplanationOpen] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const sessions = profile.sessionHistory || [];

  const handleEditSession = (sessionIndex: number) => {
    const session = sessions[sessionIndex];
    console.log('[SessionHistory] Edit session clicked:', session);
    
    // If session doesn't have sessionData, it's an old session before we started saving questions
    if (!session.sessionData || session.sessionData.length === 0) {
      console.log('[SessionHistory] No session data found - this is an old session before question data was saved');
      
      // Don't create mock data - just show an error message
      // The edit dialog will handle this gracefully
    }
    
    if (session.sessionData && session.sessionData.length > 0) {
      setEditingSessionIndex(sessionIndex);
      setEditDialogOpen(true);
      console.log('[SessionHistory] Opening edit dialog for session:', sessionIndex);
    } else {
      console.log('[SessionHistory] Session still has no data to edit');
    }
  };

  const handleSaveEditedAnswers = async (updatedData: Array<{questionId: string; questionText: string; answer: string; editedAt?: number}>) => {
    if (editingSessionIndex === null) return;
    
    console.log(`[SessionHistory] Saving edited answers for session ${editingSessionIndex}`);
    
    try {
      // First, re-analyze the edited answers to get new scores
      const originalSession = profile.sessionHistory?.[editingSessionIndex];
      const newSessionData = await reAnalyzeSession(updatedData, editingSessionIndex, originalSession);
      
      // Update the profile with edited answers and new scores
      let updatedProfile = { ...profile };
      
      if (updatedProfile.sessionHistory && updatedProfile.sessionHistory[editingSessionIndex]) {
        // Update session data
        updatedProfile.sessionHistory[editingSessionIndex].sessionData = updatedData;
        
        // Update session with new scores and points
        updatedProfile = updateProfileWithNewSessionData(updatedProfile, editingSessionIndex, newSessionData);
        
        // Recalculate total points using unified system
        updatedProfile = updateProfilePoints(updatedProfile);
        
        console.log(`[SessionHistory] Session ${editingSessionIndex} updated:`, {
          oldScore: profile.sessionHistory?.[editingSessionIndex]?.humanScore,
          newScore: newSessionData.humanScore,
          oldPoints: profile.sessionHistory?.[editingSessionIndex]?.pointsEarned,
          newPoints: newSessionData.pointsEarned,
          totalProfilePoints: updatedProfile.points,
          scoreComparisons: newSessionData.scoreComparisons,
          overallImprovement: newSessionData.overallImprovement
        });
        
        // Show score comparison to user in console for debugging
        if (newSessionData.scoreComparisons) {
          console.table(newSessionData.scoreComparisons.map(comp => ({
            Question: comp.questionId,
            'Quality Change': `${comp.original.quality} → ${comp.new.quality} (${comp.change.quality >= 0 ? '+' : ''}${comp.change.quality})`,
            'Sincerity Change': `${comp.original.sincerity} → ${comp.new.sincerity} (${comp.change.sincerity >= 0 ? '+' : ''}${comp.change.sincerity})`,
            'Points Change': `${comp.original.points} → ${comp.new.points} (${comp.change.points >= 0 ? '+' : ''}${comp.change.points})`,
            'Reasoning': comp.reasoning || 'No explanation provided'
          })));
        }
        
        // Save to local storage
        saveProfile(updatedProfile);
        
        // Update parent component
        onUpdateProfile(updatedProfile);
      }
    } catch (error) {
      console.error('[SessionHistory] Error recalculating session scores:', error);
      
      // Fallback: save answers without recalculation
      const updatedProfile = { ...profile };
      if (updatedProfile.sessionHistory && updatedProfile.sessionHistory[editingSessionIndex]) {
        updatedProfile.sessionHistory[editingSessionIndex].sessionData = updatedData;
        updatedProfile.updatedAt = Date.now();
        saveProfile(updatedProfile);
        onUpdateProfile(updatedProfile);
      }
    }
    
    setEditDialogOpen(false);
    setEditingSessionIndex(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-900" />
          <h2 className="text-xl font-semibold text-gray-900">Session History</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScoringExplanationOpen(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 transition-colors"
            title="How are sessions scored?"
          >
            <Info className="w-3 h-3" />
            Scoring Info
          </button>
          
          {sessions.length > 0 && (
            <span className="text-sm text-gray-600">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No sessions completed yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start your first Mirror session to see your history here
          </p>
          <a
            href="/mirror"
            className="inline-block mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
          >
            Start Session
          </a>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sessions
            .sort((a, b) => b.date - a.date)
            .map((session, index) => (
              <motion.div
                key={session.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedSession(expandedSession === index ? null : index)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium">
                        {formatDate(session.date)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatTime(session.date)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className={`text-sm font-medium ${getScoreColor(session.humanScore)}`}>
                          {session.humanScore}/100 ({getScoreGrade(session.humanScore)})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          +{session.pointsEarned} pts
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          {session.questionsAnswered} questions
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight 
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedSession === index ? 'rotate-90' : ''
                    }`} 
                  />
                </div>

                {expandedSession === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 p-4 bg-gray-50"
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Performance:</span>
                          <div className="mt-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    session.humanScore >= 80 ? 'bg-green-500' :
                                    session.humanScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                                  }`}
                                  style={{ width: `${session.humanScore}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${getScoreColor(session.humanScore)}`}>
                                {session.humanScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">Points Breakdown:</span>
                          <div className="mt-1 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Base Questions:</span>
                              <span>{session.questionsAnswered * 500}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Quality Bonus:</span>
                              <span>+{session.pointsEarned - (session.questionsAnswered * 500)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <button 
                          onClick={() => handleEditSession(index)}
                          className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Review & Improve Answers
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.sessionData && session.sessionData.length > 0 
                            ? "Revisit this session to potentially improve your human score"
                            : "Session data not available for editing"
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(sessions.reduce((sum, s) => sum + s.humanScore, 0) / sessions.length)}
              </div>
              <div className="text-gray-600">Avg Score</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {sessions.reduce((sum, s) => sum + s.pointsEarned, 0).toLocaleString()}
              </div>
              <div className="text-gray-600">Total Points</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {sessions.reduce((sum, s) => sum + s.questionsAnswered, 0)}
              </div>
              <div className="text-gray-600">Questions</div>
            </div>
          </div>
        </div>
      )}

      <EditSessionDialog
        key={`edit-session-${editingSessionIndex}`}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingSessionIndex(null);
        }}
        sessionData={editingSessionIndex !== null ? sessions[editingSessionIndex]?.sessionData : undefined}
        sessionIndex={editingSessionIndex || 0}
        onSave={handleSaveEditedAnswers}
      />

      <ScoringExplanation
        isOpen={scoringExplanationOpen}
        onClose={() => setScoringExplanationOpen(false)}
      />
    </div>
  );
} 