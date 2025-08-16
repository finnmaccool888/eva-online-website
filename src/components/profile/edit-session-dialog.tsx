"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";

interface SessionData {
  questionId: string;
  questionText: string;
  answer: string;
  editedAt?: number;
}

interface EditSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: SessionData[] | undefined;
  sessionIndex: number;
  onSave: (updatedData: SessionData[]) => Promise<void>;
}

export default function EditSessionDialog({ 
  isOpen, 
  onClose, 
  sessionData, 
  sessionIndex,
  onSave 
}: EditSessionDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editedAnswers, setEditedAnswers] = useState<SessionData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if we've initialized to prevent resetting user's edits
  const initializedRef = useRef(false);
  const lastSessionIndexRef = useRef<number>(-1);
  
  // Debug logging
  console.log('[EditSessionDialog] Rendered with:', { isOpen, sessionData, sessionIndex, initialized: initializedRef.current });

  // Initialize edited answers when dialog opens with new session data
  useEffect(() => {
    if (isOpen && sessionData && (!initializedRef.current || lastSessionIndexRef.current !== sessionIndex)) {
      console.log('[EditSessionDialog] Initializing with sessionData:', sessionData);
      setEditedAnswers([...sessionData]);
      setCurrentQuestionIndex(0);
      setHasChanges(false);
      initializedRef.current = true;
      lastSessionIndexRef.current = sessionIndex;
    } else if (!isOpen) {
      // Reset when dialog closes
      initializedRef.current = false;
      lastSessionIndexRef.current = -1;
    }
  }, [isOpen, sessionData, sessionIndex]);

  // Define these values safely
  const currentQuestion = editedAnswers[currentQuestionIndex];
  const totalQuestions = editedAnswers.length;

  const handleAnswerChange = (newAnswer: string) => {
    console.log('[EditSessionDialog] Answer changing:', { currentQuestionIndex, newAnswer: newAnswer.slice(0, 50) + '...' });
    const updatedAnswers = [...editedAnswers];
    updatedAnswers[currentQuestionIndex] = {
      ...updatedAnswers[currentQuestionIndex],
      answer: newAnswer,
      editedAt: Date.now()
    };
    setEditedAnswers(updatedAnswers);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedAnswers);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('[EditSessionDialog] Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Don't render anything if not in browser or dialog not open
  if (typeof window === 'undefined' || !isOpen) return null;
  
  // Ensure document.body exists before creating portal
  if (!document?.body) return null;

  // Create the modal content
  const modalContent = (!sessionData || sessionData.length === 0) ? (
    // Handle invalid session data
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm"
        style={{ margin: 0, padding: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-900">No Session Data</h2>
          <p className="text-gray-600 mb-4">
            This session was completed before we started saving question data. Only new sessions will have editable questions.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  ) : (
    // Main dialog
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        style={{ margin: 0, padding: '16px' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl border border-gray-200 w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden mx-auto"
          style={{ maxWidth: '1024px', width: '90vw' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Edit3 className="w-6 h-6 text-pink-600" />
                  Review & Improve Your Answers
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                  <span className="text-gray-400">•</span>
                  <span>Session {sessionIndex + 1}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="p-3 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 py-4">
            <div className="px-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-6">
              {/* Show loading if currentQuestion isn't available yet */}
              {!currentQuestion ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <p className="text-lg text-gray-600">Loading session data...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Question Section */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Question</h3>
                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                      <p className="text-gray-700 text-base leading-relaxed">{currentQuestion.questionText}</p>
                    </div>
                  </div>

                  {/* Answer Section */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">Your Answer</h3>
                    <textarea
                      value={currentQuestion?.answer || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      className="w-full h-40 p-4 bg-gray-50 rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all duration-200 text-base leading-relaxed text-gray-900"
                      placeholder="Share your thoughts in detail..."
                    />
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-gray-600 font-medium">
                        {currentQuestion?.answer?.length || 0} characters
                      </span>
                      {currentQuestion.editedAt && (
                        <span className="text-gray-600">
                          Last edited: {new Date(currentQuestion.editedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <button
                    onClick={goToNext}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <span className="text-sm text-orange-600 font-medium">
                      Unsaved changes
                    </span>
                  )}
                  
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Recalculating Scores...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Unsaved Changes Indicator */}
            {hasChanges && (
              <div className="sm:hidden px-3 pb-2">
                <span className="text-xs text-orange-600 font-medium">
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Use portal to render in document.body to escape any container constraints
  return createPortal(modalContent, document.body);
} 