-- Bug Bounty Points System
-- Adds points tracking to bug reports

-- Add points_awarded column to bug_reports table
ALTER TABLE bug_reports 
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;

-- Add points_awarded_at timestamp
ALTER TABLE bug_reports 
ADD COLUMN IF NOT EXISTS points_awarded_at TIMESTAMP WITH TIME ZONE;

-- Add points_awarded_by to track who awarded the points
ALTER TABLE bug_reports 
ADD COLUMN IF NOT EXISTS points_awarded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create a function to award points for bug reports
CREATE OR REPLACE FUNCTION award_bug_bounty_points(
  p_bug_report_id UUID,
  p_points INTEGER,
  p_awarded_by UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_current_status TEXT;
  v_twitter_handle TEXT;
BEGIN
  -- Get the bug report details
  SELECT user_id, status, twitter_handle INTO v_user_id, v_current_status, v_twitter_handle
  FROM bug_reports
  WHERE id = p_bug_report_id;
  
  -- Check if bug report exists and has a user
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Bug report not found or has no associated user';
  END IF;
  
  -- Check if points have already been awarded
  IF EXISTS (
    SELECT 1 FROM bug_reports 
    WHERE id = p_bug_report_id 
    AND points_awarded > 0
  ) THEN
    RAISE EXCEPTION 'Points have already been awarded for this bug report';
  END IF;
  
  -- Start transaction
  BEGIN
    -- Update bug report with points
    UPDATE bug_reports
    SET 
      points_awarded = p_points,
      points_awarded_at = TIMEZONE('utc', NOW()),
      points_awarded_by = p_awarded_by,
      status = 'accepted',
      updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_bug_report_id;
    
    -- Add points to user profile
    UPDATE user_profiles
    SET 
      points = points + p_points,
      updated_at = TIMEZONE('utc', NOW())
    WHERE user_id = v_user_id;
    
    -- If user_profiles doesn't exist, create it
    IF NOT FOUND THEN
      INSERT INTO user_profiles (user_id, points, updated_at)
      VALUES (v_user_id, p_points, TIMEZONE('utc', NOW()));
    END IF;
    
    -- Log the event in analytics
    INSERT INTO analytics_events (user_id, event_name, properties)
    VALUES (
      v_user_id,
      'bug_bounty_points_awarded',
      jsonb_build_object(
        'bug_report_id', p_bug_report_id,
        'points', p_points,
        'awarded_by', p_awarded_by,
        'twitter_handle', v_twitter_handle
      )
    );
    
    RETURN TRUE;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Create a view to see bug reports with point values
CREATE OR REPLACE VIEW bug_reports_with_points AS
SELECT 
  br.*,
  u.twitter_handle as submitter_handle,
  u.twitter_name as submitter_name,
  up.points as user_total_points,
  CASE 
    WHEN br.severity = 'critical' THEN 1000
    WHEN br.severity = 'high' THEN 500
    WHEN br.severity = 'medium' THEN 250
    WHEN br.severity = 'low' THEN 100
    ELSE 0
  END as suggested_points
FROM bug_reports br
LEFT JOIN users u ON br.user_id = u.id
LEFT JOIN user_profiles up ON br.user_id = up.user_id
ORDER BY br.created_at DESC;

-- Grant permissions
GRANT SELECT ON bug_reports_with_points TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_points_awarded ON bug_reports(points_awarded) WHERE points_awarded > 0;
