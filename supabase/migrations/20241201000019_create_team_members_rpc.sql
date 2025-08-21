-- Migration: Create RPC function for team members
-- Description: Creates a more efficient RPC function to get company team members
-- with user profile data, replacing the complex application-side logic.

CREATE OR REPLACE FUNCTION get_company_team_members(company_id_param UUID)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  user_id UUID,
  role TEXT,
  permissions JSONB,
  joined_at TIMESTAMPTZ,
  is_active BOOLEAN,
  working_days TEXT[],
  working_hours_start TIME,
  working_hours_end TIME,
  is_part_time BOOLEAN,
  working_schedule_notes TEXT,
  daily_schedule JSONB,
  weekly_hours NUMERIC,
  is_pending_invitation BOOLEAN,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.*,
    CASE 
      WHEN cm.is_active THEN false
      ELSE true
    END as is_pending_invitation,
    up.email as user_email,
    up.first_name as user_first_name,
    up.last_name as user_last_name,
    up.avatar_url as user_avatar_url
  FROM company_members cm
  LEFT JOIN user_profiles up ON cm.user_id = up.id
  WHERE cm.company_id = company_id_param
  ORDER BY cm.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_company_team_members(UUID) TO authenticated;

-- Create a function for pending invitations
CREATE OR REPLACE FUNCTION get_company_pending_invitations(company_id_param UUID)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  invited_email TEXT,
  invited_by UUID,
  invitation_token TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT,
  role TEXT,
  message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.company_id,
    ci.invited_email,
    ci.invited_by,
    ci.invitation_token,
    ci.expires_at,
    ci.status,
    ci.role,
    ci.message,
    ci.created_at,
    ci.updated_at
  FROM company_invitations ci
  WHERE ci.company_id = company_id_param 
    AND ci.status = 'pending'
    AND ci.expires_at > NOW()
  ORDER BY ci.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_company_pending_invitations(UUID) TO authenticated;
