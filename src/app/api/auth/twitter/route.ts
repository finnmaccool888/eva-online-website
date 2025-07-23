import { NextResponse } from 'next/server';
import crypto from 'crypto';

function base64URLEncode(str: Buffer): string {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeVerifier(): string {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  return verifier;
}

function generateCodeChallenge(verifier: string): string {
  const challenge = base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
  return challenge;
}

export async function GET() {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    
    // Better validation and logging
    console.log('Environment check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      baseUrl: baseUrl,
      nodeEnv: process.env.NODE_ENV
    });
    
    if (!clientId) {
      console.log('Twitter credentials not found, using demo mode');
      const callbackUrl = `${baseUrl}/api/auth/twitter/callback?code=demo_code&state=demo_state`;
      return NextResponse.json({ authUrl: callbackUrl });
    }

    if (!clientSecret) {
      console.error('TWITTER_CLIENT_SECRET is missing!');
      return NextResponse.json(
        { error: 'Twitter configuration incomplete' },
        { status: 500 }
      );
    }
    
    // Real Twitter OAuth 2.0 flow with proper PKCE
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    // Store the code verifier (in production, use a secure session store)
    // For now, we'll include it in the state parameter (not recommended for production)
    const stateWithVerifier = `${state}:${codeVerifier}`;
    
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', `${baseUrl}/api/auth/twitter/callback`);
    authUrl.searchParams.append('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.append('state', stateWithVerifier);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    console.log('Generated auth URL:', authUrl.toString());
    console.log('Callback URL will be:', `${baseUrl}/api/auth/twitter/callback`);
    
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Twitter authentication' },
      { status: 500 }
    );
  }
} 