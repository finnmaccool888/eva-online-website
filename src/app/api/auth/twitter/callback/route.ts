import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Twitter OAuth error:', error);
      const redirectUrl = new URL('/og-checker', request.url);
      redirectUrl.searchParams.set('error', 'twitter_oauth_error');
      redirectUrl.searchParams.set('message', 'Twitter authentication failed');
      redirectUrl.searchParams.set('details', error);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      const redirectUrl = new URL('/og-checker', request.url);
      redirectUrl.searchParams.set('error', 'no_code');
      redirectUrl.searchParams.set('message', 'No authorization code received');
      return NextResponse.redirect(redirectUrl);
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    if (!clientId || !clientSecret) {
      console.log('Twitter credentials not found, using demo mode');
      const redirectUrl = new URL('/og-checker', request.url);
      redirectUrl.searchParams.set('twitter_username', 'starlordyftw');
      redirectUrl.searchParams.set('twitter_verified', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Extract code verifier from state (in production, use secure session storage)
    const [, codeVerifier] = state?.split(':') || [];
    
    if (!codeVerifier) {
      console.error('Code verifier not found in state');
      const redirectUrl = new URL('/og-checker', request.url);
      redirectUrl.searchParams.set('error', 'auth_failed');
      redirectUrl.searchParams.set('message', 'Invalid authentication state');
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for access token
    try {
      console.log('Starting token exchange with Twitter API...');
      
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${baseUrl}/api/auth/twitter/callback`,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText,
          redirectUri: `${baseUrl}/api/auth/twitter/callback`,
          codeVerifierLength: codeVerifier.length
        });
        
        // Check for specific Twitter errors
        if (tokenResponse.status === 400) {
          throw new Error('Invalid OAuth request - check your Twitter app configuration');
        } else if (tokenResponse.status === 401) {
          throw new Error('Invalid client credentials - check your Twitter API keys');
        } else {
          throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
        }
      }

      const tokenData = await tokenResponse.json();
      console.log('Token exchange successful');

      // Get user information  
      console.log('Fetching user information from Twitter API...');
      const userResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const userErrorText = await userResponse.text();
        console.error('User info fetch failed:', {
          status: userResponse.status,
          error: userErrorText
        });
        throw new Error(`Failed to fetch user information: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const username = userData.data?.username;

      console.log('Successfully authenticated user:', username);

      // Redirect with user information
      const redirectUrl = new URL('/og-checker', request.url);
      redirectUrl.searchParams.set('twitter_username', username || 'unknown');
      redirectUrl.searchParams.set('twitter_verified', 'true');
      return NextResponse.redirect(redirectUrl);

    } catch (tokenError) {
      console.error('OAuth token exchange error:', tokenError);
      const redirectUrl = new URL('/og-checker', request.url);
      redirectUrl.searchParams.set('error', 'auth_failed');
      redirectUrl.searchParams.set('message', 'Failed to complete authentication');
      redirectUrl.searchParams.set('details', tokenError instanceof Error ? tokenError.message : 'Unknown error');
      return NextResponse.redirect(redirectUrl);
    }

  } catch (error) {
    console.error('Twitter callback error:', error);
    const redirectUrl = new URL('/og-checker', request.url);
    redirectUrl.searchParams.set('error', 'auth_failed');
    redirectUrl.searchParams.set('message', 'Authentication processing failed');
    return NextResponse.redirect(redirectUrl);
  }
} 