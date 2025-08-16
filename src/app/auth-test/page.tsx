'use client';

import { useState } from 'react';

export default function AuthTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  async function testOAuthConfig() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/twitter/health');
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: error.toString() });
    } finally {
      setLoading(false);
    }
  }
  
  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/twitter/callback`
    : 'Loading...';
  
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Twitter OAuth Configuration Test</h1>
        
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold">Important Setup Instructions</h2>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">1. Twitter App Settings:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Go to <a href="https://developer.twitter.com/en/portal/projects-and-apps" target="_blank" className="text-blue-500 underline">Twitter Developer Portal</a></li>
              <li>Select your app and go to "User authentication settings"</li>
              <li>Ensure OAuth 2.0 is enabled</li>
              <li>Set Type of App to "Web App"</li>
            </ul>
            
            <p className="font-semibold mt-4">2. Required Callback URL:</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs break-all">
              {callbackUrl}
            </div>
            <p className="text-xs text-muted-foreground">This EXACT URL must be added to your Twitter app\'s callback URLs</p>
            
            <p className="font-semibold mt-4">3. Required Permissions:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Read tweet</li>
              <li>Read users</li>
              <li>Offline access (for refresh tokens)</li>
            </ul>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold">OAuth Configuration Status</h2>
          <button
            onClick={testOAuthConfig}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Configuration'}
          </button>
          
          {testResult && (
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          )}
        </div>
        
        <div className="border rounded-lg p-4 space-y-4">
          <h2 className="text-xl font-semibold">Environment Variables Required</h2>
          <ul className="space-y-2 text-sm font-mono">
            <li>TWITTER_CLIENT_ID</li>
            <li>TWITTER_CLIENT_SECRET</li>
            <li>NEXT_PUBLIC_URL (optional, for production)</li>
          </ul>
        </div>
        
        <div className="flex gap-4">
          <a
            href="/mirror"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Try Authentication
          </a>
        </div>
      </div>
    </div>
  );
}
