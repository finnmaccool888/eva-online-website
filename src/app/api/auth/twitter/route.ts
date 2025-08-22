import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Twitter OAuth 2.0 endpoints
const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

// OAuth 2.0 configuration
const CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NODE_ENV === "production" 
  ? "https://www.evaonline.xyz/api/auth/twitter/callback"
  : "http://localhost:3000/api/auth/twitter/callback";

// Base64URL encode helper
function base64URLEncode(str: Buffer): string {
  return str.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// PKCE generator
function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(crypto.createHash("sha256").update(verifier).digest());
}

export async function GET(req: NextRequest) {
  try {
    // Get return URL from query parameter, default to /mirror
    const returnTo = req.nextUrl.searchParams.get('returnTo') || '/mirror';
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    
    // Validate return URL to prevent open redirect attacks
    const allowedReturnPaths = ['/mirror', '/bug-bounty', '/profile', '/'];
    const isValidReturnPath = allowedReturnPaths.some(path => returnTo.startsWith(path));
    const finalReturnTo = isValidReturnPath ? returnTo : '/mirror';
    
    // Check if credentials exist
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing Twitter OAuth credentials", {
        hasClientId: !!CLIENT_ID,
        hasClientSecret: !!CLIENT_SECRET,
        clientIdLength: CLIENT_ID?.length || 0,
        nodeEnv: process.env.NODE_ENV
      });
      return NextResponse.redirect(`${baseUrl}${finalReturnTo}?error=config_error`);
    }

    // Generate PKCE code verifier and state
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = Math.random().toString(36).substring(7);
    
    console.log("OAuth request:", {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      hasSecret: !!CLIENT_SECRET
    });
    
    // Create the redirect URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "tweet.read users.read offline.access",
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });
    
    const authUrl = `${TWITTER_AUTH_URL}?${params}`;
    
    console.log("OAuth URL being generated:", {
      authUrl,
      params: params.toString(),
      redirectUri: REDIRECT_URI,
      clientId: CLIENT_ID,
      clientIdLength: CLIENT_ID.length
    });
    
    // Store in cookies for callback
    const response = NextResponse.redirect(authUrl);
    const isProduction = process.env.NODE_ENV === "production";
    
    console.log("Setting OAuth state cookies and redirecting to Twitter");
    
    // Clear any existing auth cookies to prevent conflicts
    response.cookies.set("twitter_auth", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax"
    });
    
    response.cookies.set("twitter_auth_client", "", {
      maxAge: 0,
      path: "/",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax"
    });
    
    // Set cookies with proper options
    response.cookies.set("twitter_state", state, {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });
    
    response.cookies.set("code_verifier", codeVerifier, {
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });
    
    // Store return URL for callback
    response.cookies.set("auth_return_to", finalReturnTo, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error("Twitter OAuth error:", error);
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const returnTo = req.nextUrl.searchParams.get('returnTo') || '/mirror';
    const allowedReturnPaths = ['/mirror', '/bug-bounty', '/profile', '/'];
    const isValidReturnPath = allowedReturnPaths.some(path => returnTo.startsWith(path));
    const finalReturnTo = isValidReturnPath ? returnTo : '/mirror';
    return NextResponse.redirect(`${baseUrl}${finalReturnTo}?error=auth_failed`);
  }
} 