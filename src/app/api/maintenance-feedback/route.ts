import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { twitter, email, message } = body;

    if (!twitter || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    // Store feedback in a maintenance_feedback table (you'll need to create this table)
    const { error } = await supabase
      .from('maintenance_feedback')
      .insert({
        twitter_handle: twitter,
        email: email,
        message: message,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing feedback:', error);
      // For now, we'll still return success even if DB fails
      // In production, you might want to handle this differently
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
