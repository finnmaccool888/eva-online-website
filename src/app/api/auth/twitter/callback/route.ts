import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateUser } from "@/lib/supabase/services";
import { hasValidSupabaseConfig } from "@/lib/supabase/client";
import { isOG } from "@/lib/mirror/og-verification";

const CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NODE_ENV === "production" 
  ? "https://www.evaonline.xyz/api/auth/twitter/callback"
  : "http://localhost:3000/api/auth/twitter/callback";

interface TwitterTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

interface TwitterUser {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    verified?: boolean;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Get the base URL for redirects
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const isProduction = process.env.NODE_ENV === "production";
    
    // Get stored return URL, default to /mirror
    const returnTo = req.cookies.get("auth_return_to")?.value || '/mirror';
    
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    
    // Check for errors
    if (error) {
      const errorDescription = searchParams.get("error_description");
      console.error("Twitter OAuth error:", {
        error,
        errorDescription,
        fullUrl: req.url
      });
      return NextResponse.redirect(`${baseUrl}${returnTo}?error=${error}&details=${encodeURIComponent(errorDescription || "No description")}`);
    }
    
    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}${returnTo}?error=missing_params`);
    }
    
    // Verify state
    const storedState = req.cookies.get("twitter_state")?.value;
    const codeVerifier = req.cookies.get("code_verifier")?.value;
    
    console.log("OAuth callback - state verification:", {
      receivedState: state,
      storedState: storedState || "missing",
      hasCodeVerifier: !!codeVerifier,
      allCookies: req.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
    });
    
    if (!storedState || storedState !== state || !codeVerifier) {
      console.error("State mismatch or missing code verifier:", {
        storedState: storedState || "missing",
        receivedState: state,
        stateMatch: storedState === state,
        hasCodeVerifier: !!codeVerifier
      });
      
      // Clear the OAuth state cookies to prevent persistent errors
      const response = NextResponse.redirect(`${baseUrl}${returnTo}?error=invalid_state`);
      response.cookies.set("twitter_state", "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax"
      });
      response.cookies.set("code_verifier", "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax"
      });
      response.cookies.set("auth_return_to", "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax"
      });
      
      return response;
    }
    
    // Exchange code for access token
    console.log("Token exchange attempt:", {
      redirectUri: REDIRECT_URI,
      codeLength: code.length,
      hasCodeVerifier: !!codeVerifier,
      clientIdLength: CLIENT_ID?.length || 0
    });
    
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: error,
        redirectUri: REDIRECT_URI,
        nodeEnv: process.env.NODE_ENV
      });
      return NextResponse.redirect(`${baseUrl}${returnTo}?error=token_failed&details=${encodeURIComponent(error.substring(0, 100))}`);
    }
    
    const tokenData: TwitterTokenResponse = await tokenResponse.json();
    
    // Get user information
    const userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,verified", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`
      },
    });
    
    if (!userResponse.ok) {
      console.error("Failed to get user info");
      return NextResponse.redirect(`${baseUrl}${returnTo}?error=user_fetch_failed`);
    }
    
    const userData: TwitterUser = await userResponse.json();
    const user = userData.data;
    
    // Check if user is an OG
    const userIsOG = isOG(user.username);
    
    let ogPointsAwarded = false;
    
    // Create or update user in Supabase if configured
    if (hasValidSupabaseConfig) {
      try {
        const result = await createOrUpdateUser(user.username, user.name, userIsOG);
        ogPointsAwarded = result.ogPointsAwarded || false;
      } catch (dbError) {
        console.error("Database error (non-fatal):", dbError);
        // Continue without database - auth will still work
      }
    } else {
      console.log("Supabase not configured, skipping database operations");
    }
    
    // Create auth session
    const authData = {
      twitterId: user.id,
      twitterHandle: user.username,
      twitterName: user.name,
      profileImage: user.profile_image_url,
      verifiedAt: new Date().toISOString(),
      lastChecked: Date.now(),
      accessToken: tokenData.access_token, // Store securely in production
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
    };
    
    // Prepare auth data for client
    const authCookieData = {
      twitterId: authData.twitterId,
      twitterHandle: authData.twitterHandle,
      twitterName: authData.twitterName,
      profileImage: authData.profileImage,
      verifiedAt: authData.verifiedAt,
      lastChecked: authData.lastChecked,
      isOG: userIsOG,
      ogPointsAwarded: ogPointsAwarded || false,
    };
    
    // Encode auth data for URL parameter as fallback
    const encodedAuth = Buffer.from(JSON.stringify(authCookieData)).toString('base64url');
    
    // Redirect with encoded auth data to the stored return URL
    const response = NextResponse.redirect(`${baseUrl}${returnTo}?auth=success&data=${encodedAuth}`);
    
    console.log("Setting auth cookie:", authCookieData);
    
    // Set cookie with all necessary options
    response.cookies.set({
      name: "twitter_auth",
      value: JSON.stringify(authCookieData),
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    // Also set a non-httpOnly cookie as backup for client-side reading
    response.cookies.set({
      name: "twitter_auth_client",
      value: JSON.stringify(authCookieData),
      httpOnly: false,
      secure: isProduction, // Use secure cookies in production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    
    // Clean up state cookies
    response.cookies.delete("twitter_state");
    response.cookies.delete("code_verifier");
    response.cookies.delete("auth_return_to");
    
    console.log("Auth callback success, redirecting to return URL:", returnTo);
    
    return response;
    
  } catch (error: any) {
    console.error("Twitter callback error:", error);
    // Get the base URL for error redirect
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    
    // Get stored return URL for error redirect, default to /mirror
    const returnTo = req.cookies.get("auth_return_to")?.value || '/mirror';
    
    // Try to provide more specific error information
    let errorType = "callback_failed";
    let errorDetails = "Unknown error";
    
    if (error.message) {
      errorDetails = error.message.substring(0, 100);
    }
    
    if (error.message?.includes("fetch")) {
      errorType = "network_error";
    } else if (error.message?.includes("token")) {
      errorType = "token_error";
    } else if (error.message?.includes("user")) {
      errorType = "user_fetch_error";
    }
    
    return NextResponse.redirect(`${baseUrl}${returnTo}?error=${errorType}&details=${encodeURIComponent(errorDetails)}`);
  }
} 