"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestOAuthPage() {
  const [healthData, setHealthData] = useState<Record<string, unknown> | null>(null)
  const [authUrl, setAuthUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/twitter/health")
      const data = await response.json()
      setHealthData(data)
    } catch {
      setHealthData({ error: "Failed to fetch health data" })
    }
    setLoading(false)
  }

  const getAuthUrl = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/twitter")
      const data = await response.json()
      setAuthUrl(data.authUrl || "No auth URL returned")
      console.log("Full response:", data)
    } catch (err) {
      setAuthUrl("Error: " + err)
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OAuth Debug Page</h1>
      
      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">1. Health Check</h2>
          <Button onClick={checkHealth} disabled={loading}>
            Check Health Endpoint
          </Button>
          {healthData && (
            <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">2. Auth URL</h2>
          <Button onClick={getAuthUrl} disabled={loading}>
            Get Auth URL
          </Button>
          {authUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Auth URL:</p>
              <p className="text-xs break-all bg-gray-100 p-4 rounded">{authUrl}</p>
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">3. Current Location</h2>
          <p className="text-sm">Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
          <p className="text-sm">Expected Callback: {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/twitter/callback` : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
} 