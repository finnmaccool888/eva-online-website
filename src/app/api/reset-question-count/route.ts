import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { twitterHandle } = await request.json();
    
    if (!twitterHandle) {
      return NextResponse.json({ error: 'Twitter handle required' }, { status: 400 });
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get actual sessions from database
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('questions_answered')
      .eq('user_id', user.id)
      .eq('is_complete', true);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Calculate actual total questions from real sessions
    const actualQuestions = sessions?.reduce((sum, session) => {
      return sum + (session.questions_answered || 0);
    }, 0) || 0;

    // Update profile with correct count
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        total_questions_answered: actualQuestions
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      actualQuestions,
      sessionsCount: sessions?.length || 0
    });

  } catch (error) {
    console.error('Reset question count error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
