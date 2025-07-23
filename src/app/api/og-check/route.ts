import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EVA-OG-Checker/1.0; +https://evaonline.xyz)'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch the webpage' },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Parse meta tags using regex
    const metaTags: Record<string, string> = {};

    // Extract title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch) {
      metaTags.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    if (descMatch) {
      metaTags.description = descMatch[1].trim();
    }

    // Extract Open Graph tags
    const ogRegex = /<meta\s+property="(og:[^"]*)"\s+content="([^"]*)"/gi;
    let ogMatch;
    while ((ogMatch = ogRegex.exec(html)) !== null) {
      const property = ogMatch[1].replace('og:', '');
      metaTags[property] = ogMatch[2].trim();
    }

    // Extract Twitter Card tags
    const twitterRegex = /<meta\s+name="(twitter:[^"]*)"\s+content="([^"]*)"/gi;
    let twitterMatch;
    while ((twitterMatch = twitterRegex.exec(html)) !== null) {
      const property = twitterMatch[1].replace(':', '_');
      metaTags[property] = twitterMatch[2].trim();
    }

    return NextResponse.json({
      url,
      metaTags,
      success: true
    });

  } catch (error) {
    console.error('OG Check Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 