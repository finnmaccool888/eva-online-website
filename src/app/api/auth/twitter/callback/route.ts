import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
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

    // In a real implementation, you would:
    // 1. Exchange the code for an access token
    // 2. Fetch user profile from Twitter API
    // 3. Verify the user
    
    // For demo purposes, we'll simulate a successful authentication
    // with a test user that's in the OG list
    const redirectUrl = new URL('/og-checker', request.url);
    redirectUrl.searchParams.set('twitter_username', 'starlordyftw'); // This user is in the OG list
    redirectUrl.searchParams.set('twitter_verified', 'true');
    
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Twitter callback error:', error);
    const redirectUrl = new URL('/og-checker', request.url);
    redirectUrl.searchParams.set('error', 'auth_failed');
    redirectUrl.searchParams.set('message', 'Authentication processing failed');
    return NextResponse.redirect(redirectUrl);
  }
} 