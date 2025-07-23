import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_URL;

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasBaseUrl: !!baseUrl,
      baseUrl: baseUrl,
      callbackUrl: baseUrl ? `${baseUrl}/api/auth/twitter/callback` : 'Not configured'
    }
  };

  return NextResponse.json(health);
} 