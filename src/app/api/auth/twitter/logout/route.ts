import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const response = NextResponse.redirect(`${baseUrl}/mirror`);
  
  // Clear all auth-related cookies
  response.cookies.set("twitter_auth", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  });
  
  response.cookies.set("twitter_auth_client", "", {
    maxAge: 0,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "lax"
  });
  
  // Also clear any leftover OAuth state cookies
  response.cookies.set("twitter_state", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  });
  
  response.cookies.set("code_verifier", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  });
  
  console.log("User logged out, all cookies cleared");
  
  return response;
}

export async function GET(req: NextRequest) {
  return POST(req);
} 