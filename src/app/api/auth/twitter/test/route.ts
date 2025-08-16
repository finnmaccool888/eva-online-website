import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  const baseUrl = process.env.NEXT_PUBLIC_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  
  // Test if we can reach Twitter's OAuth endpoints
  let twitterTestResult = "Not tested";
  try {
    const testResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId || "",
        client_secret: clientSecret || "",
      }),
    });
    
    if (testResponse.ok) {
      twitterTestResult = "OAuth endpoint reachable";
    } else {
      const error = await testResponse.text();
      twitterTestResult = `OAuth test failed: ${testResponse.status} - ${error.substring(0, 100)}`;
    }
  } catch (error) {
    twitterTestResult = `Network error: ${error}`;
  }
  
  const diagnostics = {
    environment: {
      nodeEnv,
      isProduction: nodeEnv === "production",
      baseUrl,
    },
    credentials: {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdPrefix: clientId?.substring(0, 5) + "...",
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
    },
    urls: {
      currentUrl: req.url,
      expectedCallbackUrl: nodeEnv === "production" 
        ? "https://www.evaonline.xyz/api/auth/twitter/callback"
        : "http://localhost:3000/api/auth/twitter/callback",
      actualCallbackUrl: `${baseUrl}/api/auth/twitter/callback`,
    },
    cookies: {
      cookieHeader: req.headers.get("cookie"),
      hasCookies: !!req.headers.get("cookie"),
    },
    twitterTest: twitterTestResult,
    headers: {
      host: req.headers.get("host"),
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
      userAgent: req.headers.get("user-agent"),
    },
  };
  
  return NextResponse.json(diagnostics, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
