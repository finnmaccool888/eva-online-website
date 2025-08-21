import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getTwitterAuth } from '@/lib/mirror/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const userOnly = searchParams.get('userOnly') === 'true';
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('bug_reports')
      .select(`
        *,
        bug_report_attachments (
          id,
          file_name,
          file_size,
          file_type,
          storage_path
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    // If userOnly, filter by current user
    if (userOnly) {
      const twitterAuth = getTwitterAuth();
      if (twitterAuth?.twitterHandle) {
        // Get user ID from Twitter handle
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('twitter_handle', twitterAuth.twitterHandle)
          .single();
          
        if (userData) {
          query = query.eq('user_id', userData.id);
        } else {
          // No user found, return empty results
          return NextResponse.json({
            reports: [],
            total: 0,
            page,
            totalPages: 0
          });
        }
      } else {
        // No auth, return empty results for userOnly
        return NextResponse.json({
          reports: [],
          total: 0,
          page,
          totalPages: 0
        });
      }
    }
    
    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: reports, error, count } = await query;
    
    if (error) {
      console.error('Error fetching bug reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bug reports' },
        { status: 500 }
      );
    }
    
    // Generate signed URLs for attachments
    const reportsWithUrls = await Promise.all(
      (reports || []).map(async (report) => {
        const attachmentsWithUrls = await Promise.all(
          (report.bug_report_attachments || []).map(async (attachment) => {
            const { data: signedUrl } = await supabase.storage
              .from('bug-report-attachments')
              .createSignedUrl(attachment.storage_path, 3600); // 1 hour expiry
              
            return {
              ...attachment,
              url: signedUrl?.signedUrl
            };
          })
        );
        
        return {
          ...report,
          attachments: attachmentsWithUrls
        };
      })
    );
    
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      reports: reportsWithUrls,
      total,
      page,
      totalPages
    });
    
  } catch (error) {
    console.error('Error in bug bounty list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
