import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authCookie = req.cookies.get("twitter_auth");
    const clientCookie = req.cookies.get("twitter_auth_client");
    
    console.log("Auth check - all cookies:", req.cookies.getAll().map(c => c.name));
    console.log("Auth check - auth cookie exists:", !!authCookie);
    console.log("Auth check - client cookie exists:", !!clientCookie);
    
    // Try httpOnly cookie first
    if (authCookie?.value) {
      try {
        const authData = JSON.parse(authCookie.value);
        console.log("Auth check - using httpOnly cookie");
        return NextResponse.json({ 
          authenticated: true,
          user: authData
        });
      } catch (e) {
        console.error("Failed to parse httpOnly cookie:", e);
      }
    }
    
    // Fall back to client cookie
    if (clientCookie?.value) {
      try {
        const authData = JSON.parse(clientCookie.value);
        console.log("Auth check - using client cookie");
        return NextResponse.json({ 
          authenticated: true,
          user: authData
        });
      } catch (e) {
        console.error("Failed to parse client cookie:", e);
      }
    }
    
    console.log("Auth check - no valid auth cookie found");
    return NextResponse.json({ authenticated: false });
    
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false });
  }
} 