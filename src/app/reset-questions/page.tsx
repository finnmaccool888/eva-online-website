"use client";

import { useState } from "react";
import { useTwitterAuth } from "@/lib/hooks/useTwitterAuth";

export default function ResetQuestionsPage() {
  const { auth } = useTwitterAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!auth?.twitterHandle) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/reset-question-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twitterHandle: auth.twitterHandle })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset question count');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Reset Question Count</h1>
        
        {auth?.twitterHandle ? (
          <div>
            <p className="mb-4">This will reset your question count to match your actual sessions.</p>
            <p className="mb-4">User: @{auth.twitterHandle}</p>
            
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Question Count'}
            </button>

            {result && (
              <div className="mt-4 p-4 bg-green-100 rounded">
                <p>✅ Success!</p>
                <p>Actual questions: {result.actualQuestions}</p>
                <p>Sessions count: {result.sessionsCount}</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-100 rounded">
                <p>❌ Error: {error}</p>
              </div>
            )}
          </div>
        ) : (
          <p>Please authenticate first</p>
        )}
      </div>
    </div>
  );
}
