import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NODE_ENV === "production" 
  ? "https://www.evaonline.xyz/api/auth/twitter/callback"
  : "http://localhost:3000/api/auth/twitter/callback";

function base64URLEncode(str: Buffer): string {
  return str.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier: string): string {
  return base64URLEncode(crypto.createHash("sha256").update(verifier).digest());
}

export async function GET(req: NextRequest) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = Math.random().toString(36).substring(7);
  
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
  
  const debugInfo = {
    environment: process.env.NODE_ENV,
    credentials: {
      clientId: CLIENT_ID,
      clientIdLength: CLIENT_ID?.length || 0,
      clientSecretExists: !!CLIENT_SECRET,
      clientSecretLength: CLIENT_SECRET?.length || 0,
    },
    urls: {
      redirectUri: REDIRECT_URI,
      authUrl: authUrl,
      authUrlLength: authUrl.length,
    },
    oauthParams: {
      response_type: "code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: "tweet.read users.read offline.access",
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    },
    pkce: {
      codeVerifier: codeVerifier,
      codeChallenge: codeChallenge,
      verifierLength: codeVerifier.length,
      challengeLength: codeChallenge.length,
    },
    instructions: [
      "1. Check that clientId matches your Twitter app exactly",
      "2. Verify redirect_uri matches your Twitter app callback URL exactly",
      "3. Click the authUrl link below to test the OAuth flow",
      "4. Watch where Twitter redirects you - it should go to the redirect_uri"
    ]
  };
  
  return NextResponse.json(debugInfo, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
