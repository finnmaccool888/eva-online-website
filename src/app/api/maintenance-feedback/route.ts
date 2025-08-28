import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    console.log('[API] Maintenance feedback request received');
    
    const body = await request.json();
    const { twitter, email, message } = body;
    
    console.log('[API] Request body:', { twitter, email, message: message?.substring(0, 50) + '...' });

    if (!twitter || !email || !message) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log('[API] Using Supabase client...');
    
    console.log('[API] Attempting to insert into maintenance_feedback table...');
    const { data, error } = await supabase
      .from('maintenance_feedback')
      .insert({
        twitter_handle: twitter,
        email: email,
        message: message,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[API] Successfully inserted feedback:', data);
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
