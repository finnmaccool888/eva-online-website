import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    
    if (!clientId) {
      // Use demo mode if no credentials are set
      console.log('Twitter credentials not found, using demo mode');
      const callbackUrl = `${baseUrl}/api/auth/twitter/callback?code=demo_code&state=demo_state`;
      return NextResponse.json({ authUrl: callbackUrl });
    }
    
    // Real Twitter OAuth 2.0 flow
    const state = Math.random().toString(36).substring(7);
    const codeChallenge = 'challenge'; // In production, generate proper PKCE challenge
    
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', `${baseUrl}/api/auth/twitter/callback`);
    authUrl.searchParams.append('scope', 'tweet.read users.read');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'plain');
    
    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Twitter authentication' },
      { status: 500 }
    );
  }
} 