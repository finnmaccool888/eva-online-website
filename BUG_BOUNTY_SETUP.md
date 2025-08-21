# Bug Bounty System Setup Guide

## Overview

The bug bounty system allows **Twitter-authenticated users** to submit bug reports and earn points for verified bugs. Reports are stored in Supabase with support for file attachments and integrated with the Eva Online points system.

## Database Setup

### 1. Run the Database Schema
```bash
# In Supabase SQL Editor, run:
/supabase/bug-bounty-schema.sql
```

This creates:
- `bug_reports` table - stores bug report submissions
- `bug_report_attachments` table - stores attachment metadata
- Row Level Security policies for secure access

### 2. Set up Storage Bucket
```bash
# In Supabase SQL Editor, run:
/supabase/bug-bounty-storage.sql
```

This creates:
- `bug-report-attachments` storage bucket
- Storage policies for secure file uploads

### 3. Set up Points System
```bash
# In Supabase SQL Editor, run:
/supabase/bug-bounty-points.sql
```

This creates:
- Points tracking columns in `bug_reports` table
- `award_bug_bounty_points` function for atomic point awards
- `bug_reports_with_points` view for easier querying

### 4. Configure CORS (Important!)
In Supabase Dashboard:
1. Go to Storage > Policies
2. Click on `bug-report-attachments` bucket
3. Configure CORS to allow your domain

## Features

### User-Facing Features
- **Bug Report Submission** (`/bug-bounty`)
  - **Requires Twitter authentication**
  - Title and description fields
  - Severity levels (Critical, High, Medium, Low)
  - Categories (Security, Functionality, UI, Performance, Other)
  - File uploads (images and PDFs up to 5MB)
  - Optional email for reward notifications
  - Detailed fields for reproduction steps
  - **Points earned for verified bugs**

### Admin Features
- **Bug Reports Management** (`/admin/bug-reports`)
  - View all submitted reports
  - Filter by status and severity
  - View detailed report information
  - See attached files with preview
  - Track reward amounts
  - **Award points for verified bugs**
  - **See points already awarded**

## API Endpoints

### Submit Bug Report
`POST /api/bug-bounty/submit`
- **Requires Twitter authentication**
- Accepts FormData with bug report details and file uploads
- Validates file types and sizes
- Creates report and stores attachments

### List Bug Reports
`GET /api/bug-bounty/list`
- Query parameters:
  - `page` - page number
  - `limit` - items per page
  - `status` - filter by status
  - `severity` - filter by severity
  - `userOnly` - show only user's reports

### Award Points (Admin Only)
`POST /api/bug-bounty/award-points`
- **Requires admin Twitter account**
- Body parameters:
  - `bugReportId` - ID of the bug report
  - `points` - default points based on severity
  - `customPoints` - optional custom points override

`GET /api/bug-bounty/award-points`
- Returns whether current user can award points

## Security

- **Twitter authentication required for all submissions**
- Row Level Security (RLS) enabled on all tables
- Users can only view/edit their own reports
- Admin access controlled by Twitter handle whitelist
- File uploads restricted to specific MIME types
- File size limited to 5MB

## Reward Structure

### Points (Awarded upon verification)
- **Critical**: 1000 points + $500+
- **High**: 500 points + $250+
- **Medium**: 250 points + $100+
- **Low**: 100 points + $50+

Points are added to the user's total Eva Online points balance.

## Usage

### For Users
1. **Sign in with Twitter** (required)
2. Navigate to `/bug-bounty`
3. Fill out the bug report form
4. Attach screenshots if available
5. Submit the report
6. Earn points when your bug is verified

### For Admins
1. Navigate to `/admin/bug-reports`
2. Review submitted reports
3. Click on a report to view details
4. Award points using the "Award Points" button
5. Points are automatically added to the user's balance

## Important Configuration

### Update Admin Twitter Handles
In `/src/app/api/bug-bounty/award-points/route.ts`, update the `ADMIN_HANDLES` array with actual admin Twitter handles:
```typescript
const ADMIN_HANDLES = ['evaonlinexyz', 'admin1', 'admin2']; // Update these
```

Also update admin handles in the SQL schema (`bug-bounty-schema.sql`) for RLS policies.

## Extending the System

### Adding Email Notifications
You can add email notifications when bugs are submitted by:
1. Setting up Supabase Edge Functions
2. Using a service like SendGrid or Resend
3. Triggering emails on `bug_reports` insert

### Adding Admin Actions
To add status updates from the admin panel:
1. Create an API endpoint for updates
2. Add UI controls in the admin page
3. Implement proper authorization checks

## Troubleshooting

### File Upload Issues
- Ensure CORS is properly configured
- Check Supabase Storage bucket policies
- Verify file size and type restrictions

### Permission Errors
- Check RLS policies are applied
- Ensure user authentication is working
- Verify admin Twitter handles in policies
