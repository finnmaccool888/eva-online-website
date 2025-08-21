import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getTwitterAuth } from '@/lib/mirror/auth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Get form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const severity = formData.get('severity') as string || 'medium';
    const category = formData.get('category') as string || 'functionality';
    const email = formData.get('email') as string;
    const browserInfo = formData.get('browserInfo') as string;
    const urlWhereFound = formData.get('urlWhereFound') as string;
    const stepsToReproduce = formData.get('stepsToReproduce') as string;
    const expectedBehavior = formData.get('expectedBehavior') as string;
    const actualBehavior = formData.get('actualBehavior') as string;
    
    // Get Twitter auth - REQUIRED
    const twitterAuth = getTwitterAuth();
    
    // Check if user is authenticated
    if (!twitterAuth?.twitterHandle) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Twitter.' },
        { status: 401 }
      );
    }
    
    // Find user by Twitter handle
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('twitter_handle', twitterAuth.twitterHandle)
      .single();
      
    if (!userData || userError) {
      console.error('User not found:', userError);
      return NextResponse.json(
        { error: 'User account not found. Please ensure you are properly logged in.' },
        { status: 404 }
      );
    }
    
    const userId = userData.id;
    const twitterHandle = twitterAuth.twitterHandle;
    
    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    // Create bug report
    const { data: bugReport, error: bugReportError } = await supabase
      .from('bug_reports')
      .insert({
        user_id: userId,
        twitter_handle: twitterHandle,
        email,
        title,
        description,
        severity,
        category,
        browser_info: browserInfo,
        url_where_found: urlWhereFound,
        steps_to_reproduce: stepsToReproduce,
        expected_behavior: expectedBehavior,
        actual_behavior: actualBehavior,
      })
      .select()
      .single();
      
    if (bugReportError) {
      console.error('Error creating bug report:', bugReportError);
      return NextResponse.json(
        { error: 'Failed to create bug report' },
        { status: 500 }
      );
    }
    
    // Handle file uploads
    const files = formData.getAll('files') as File[];
    const uploadedFiles = [];
    
    for (const file of files) {
      if (file.size === 0) continue;
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Skipping file ${file.name} - invalid type: ${file.type}`);
        continue;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.warn(`Skipping file ${file.name} - too large: ${file.size}`);
        continue;
      }
      
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${bugReport.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('bug-report-attachments')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });
        
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }
      
      // Create attachment record
      const { data: attachment, error: attachmentError } = await supabase
        .from('bug_report_attachments')
        .insert({
          bug_report_id: bugReport.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: fileName
        })
        .select()
        .single();
        
      if (!attachmentError && attachment) {
        uploadedFiles.push(attachment);
      }
    }
    
    return NextResponse.json({
      success: true,
      bugReport: {
        ...bugReport,
        attachments: uploadedFiles
      }
    });
    
  } catch (error) {
    console.error('Error in bug bounty submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
