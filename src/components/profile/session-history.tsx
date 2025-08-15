"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserProfile } from "@/lib/mirror/types";
import { Calendar, Edit3, Star, TrendingUp, ChevronRight, Clock, Info } from "lucide-react";
import EditSessionDialog from "./edit-session-dialog";
import ScoringExplanation from "./scoring-explanation";
import { loadProfile, saveProfile, updateProfilePoints } from "@/lib/mirror/profile";
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
    
    // If session doesn't have sessionData, create mock data for testing
    if (!session.sessionData || session.sessionData.length === 0) {
      console.log('[SessionHistory] No session data found, creating mock data for testing');
      
      // Create mock session data for testing
      const mockSessionData = [
        {
          questionId: "q1",
          questionText: "What drives your daily motivation?",
          answer: "Mock answer - replace with your actual response",
          editedAt: Date.now()
        },
        {
          questionId: "q2", 
          questionText: "How do you define success?",
          answer: "Mock answer - replace with your actual response",
          editedAt: Date.now()
        }
      ];
      
      // Temporarily add mock data to the session
      session.sessionData = mockSessionData;
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
    <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Session History</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScoringExplanationOpen(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/30 transition-colors"
            title="How are sessions scored?"
          >
            <Info className="w-3 h-3" />
            Scoring Info
          </button>
          
          {sessions.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No sessions completed yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start your first Mirror session to see your history here
          </p>
          <a
            href="/mirror"
            className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
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
                className="border border-border rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-4 p-4 hover:bg-background/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedSession(expandedSession === index ? null : index)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium">
                        {formatDate(session.date)}
                      </span>
                      <span className="text-xs text-muted-foreground">
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
                        <span className="text-sm text-muted-foreground">
                          +{session.pointsEarned} pts
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">
                          {session.questionsAnswered} questions
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight 
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedSession === index ? 'rotate-90' : ''
                    }`} 
                  />
                </div>

                {expandedSession === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border p-4 bg-background/20"
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Performance:</span>
                          <div className="mt-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
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
                          <span className="text-muted-foreground">Points Breakdown:</span>
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

                      <div className="pt-3 border-t border-border">
                        <button 
                          onClick={() => handleEditSession(index)}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
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
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-primary">
                {Math.round(sessions.reduce((sum, s) => sum + s.humanScore, 0) / sessions.length)}
              </div>
              <div className="text-muted-foreground">Avg Score</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {sessions.reduce((sum, s) => sum + s.pointsEarned, 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">
                {sessions.reduce((sum, s) => sum + s.questionsAnswered, 0)}
              </div>
              <div className="text-muted-foreground">Questions</div>
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