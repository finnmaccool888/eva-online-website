"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Twitter, Shield, CheckCircle, AlertTriangle, ExternalLink, Clock } from "lucide-react"

interface TwitterConnectProps {
  onConnect: (handle: string) => void
}

export function TwitterConnect({ onConnect }: TwitterConnectProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

  useEffect(() => {
    // Check if we're returning from Twitter OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const twitterUsername = urlParams.get("twitter_username")
    const twitterVerified = urlParams.get("twitter_verified")

    if (twitterUsername && twitterVerified === "true") {
      setUsername(twitterUsername)
      setIsConnected(true)
      setIsVerified(true)
      onConnect(`@${twitterUsername}`)

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Check for errors
    const error = urlParams.get("error")
    if (error) {
      console.error("Twitter auth error:", error)
      setShowTroubleshooting(true)
    }
  }, [onConnect])

  // Countdown timer for rate limit
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev && prev <= 1) {
            setRateLimitError(null)
            return null
          }
          return prev ? prev - 1 : null
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const handleTwitterAuth = async () => {
    setIsLoading(true)
    setRateLimitError(null)
    setShowTroubleshooting(false)

    try {
      // Get Twitter OAuth URL from our API
      const response = await fetch("/api/auth/twitter")

      if (response.status === 429) {
        const errorData = await response.json()
        setRateLimitError(errorData.message || "Rate limit exceeded. Please wait before trying again.")
        setRetryAfter(errorData.retryAfter || 60)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.authUrl) {
        // Redirect to Twitter OAuth
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || "Failed to get auth URL")
      }
    } catch (error) {
      console.error("Twitter auth error:", error)
      setIsLoading(false)
      setShowTroubleshooting(true)
    }
  }

  const handleDisconnect = () => {
    setUsername("")
    setIsConnected(false)
    setIsVerified(false)
    setShowTroubleshooting(false)
    setRateLimitError(null)
    setRetryAfter(null)
    onConnect("")
  }

  if (isConnected && isVerified) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-green-800 bg-green-100/80 p-3 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium">Verified Twitter Account</div>
            <div className="text-sm">@{username}</div>
          </div>
          <Shield className="w-5 h-5 text-green-600" />
        </div>

        <Button
          variant="outline"
          onClick={handleDisconnect}
          className="w-full border-white/70 text-gray-800 hover:bg-white/60 bg-white/40 backdrop-blur-sm"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rate Limit Error */}
      {rateLimitError && (
        <div className="bg-orange-50/80 p-4 rounded-lg border border-orange-200 space-y-3">
          <div className="flex items-start space-x-2">
            <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <div className="font-medium mb-2">Rate Limit Reached</div>
              <p className="mb-3">{rateLimitError}</p>
              {retryAfter && (
                <div className="flex items-center space-x-2">
                  <span>Please wait:</span>
                  <span className="font-mono bg-orange-100 px-2 py-1 rounded text-orange-900">
                    {Math.floor(retryAfter / 60)}:{(retryAfter % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OAuth Error Troubleshooting */}
      {showTroubleshooting && !rateLimitError && (
        <div className="bg-red-50/80 p-4 rounded-lg border border-red-200 space-y-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <div className="font-medium mb-2">Twitter OAuth Error Detected</div>
              <p className="mb-3">
                The &quot;Something went wrong&quot; error usually means your Twitter app configuration needs to be fixed.
              </p>

              <div className="space-y-2">
                <div className="font-medium">Quick Fix Steps:</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>
                    Go to{" "}
                    <a
                      href="https://developer.twitter.com/en/portal/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Twitter Developer Portal
                    </a>
                  </li>
                  <li>Select your app → &quot;App settings&quot;</li>
                  <li>Under &quot;User authentication settings&quot; click &quot;Edit&quot;</li>
                  <li>Make sure &quot;OAuth 2.0&quot; is enabled (not OAuth 1.0a)</li>
                  <li>Set App permissions to &quot;Read&quot; only</li>
                  <li>
                    Verify callback URL matches exactly:{" "}
                    <code className="bg-gray-100 px-1 rounded text-xs">
                      {window.location.origin}/api/auth/twitter/callback
                    </code>
                  </li>
                  <li>
                    Verify Website URL matches exactly:{" "}
                    <code className="bg-gray-100 px-1 rounded text-xs">
                      {window.location.origin}
                    </code>
                  </li>
                  <li>Save all changes in Twitter Developer Portal.</li>
                  <li>Try connecting again.</li>
                </ol>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowTroubleshooting(false)} size="sm" variant="outline" className="w-full">
            Hide Troubleshooting
          </Button>
        </div>
      )}

      <div className="bg-blue-50/80 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Secure Twitter Verification</div>
            <div>We use Twitter OAuth to verify you actually own the account. Your credentials are never stored.</div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleTwitterAuth}
        disabled={isLoading || !!rateLimitError}
        className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-800 border border-blue-300 backdrop-blur-sm disabled:opacity-50"
      >
        <Twitter className="w-4 h-4 mr-2" />
        {isLoading ? "Connecting..." : rateLimitError ? `Wait ${retryAfter}s` : "Connect with Twitter OAuth"}
      </Button>

      {showTroubleshooting && !rateLimitError && (
        <div className="text-center">
          <Button
            onClick={() => window.open("https://developer.twitter.com/en/portal/dashboard", "_blank")}
            size="sm"
            variant="outline"
            className="bg-white/40 border-white/50"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Open Twitter Developer Portal
          </Button>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Secure OAuth 2.0 authentication</p>
        <p>• We only access your public profile</p>
        <p>• No posting permissions requested</p>
      </div>
    </div>
  )
} 