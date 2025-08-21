-- Migration: Fix team members RPC to include pending invitations
-- Description: Updates the get_company_team_members function to include both
-- active company members and pending invitations in a unified view.

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
  -- First, get active company members
  SELECT 
    cm.id,
    cm.company_id,
    cm.user_id,
    cm.role,
    cm.permissions,
    cm.joined_at,
    cm.is_active,
    cm.working_days,
    cm.working_hours_start,
    cm.working_hours_end,
    cm.is_part_time,
    cm.working_schedule_notes,
    cm.daily_schedule,
    cm.weekly_hours,
    false as is_pending_invitation, -- Active members are not pending invitations
    up.email as user_email,
    up.first_name as user_first_name,
    up.last_name as user_last_name,
    up.avatar_url as user_avatar_url
  FROM company_members cm
  LEFT JOIN user_profiles up ON cm.user_id = up.id
  WHERE cm.company_id = company_id_param
    AND cm.is_active = true
  
  UNION ALL
  
  -- Then, get pending invitations
  SELECT 
    ci.id,
    ci.company_id,
    gen_random_uuid() as user_id, -- Generate a temporary UUID for invitations
    ci.role,
    '{}'::jsonb as permissions, -- Empty permissions for invitations
    ci.created_at as joined_at, -- Use created_at as joined_at for invitations
    false as is_active, -- Invitations are not active
    NULL::text[] as working_days,
    NULL::time as working_hours_start,
    NULL::time as working_hours_end,
    false as is_part_time,
    NULL::text as working_schedule_notes,
    NULL::jsonb as daily_schedule,
    NULL::numeric as weekly_hours,
    true as is_pending_invitation, -- These are pending invitations
    ci.invited_email as user_email,
    NULL::text as user_first_name, -- No first name for invitations yet
    NULL::text as user_last_name,  -- No last name for invitations yet
    NULL::text as user_avatar_url  -- No avatar for invitations yet
  FROM company_invitations ci
  WHERE ci.company_id = company_id_param 
    AND ci.status = 'pending'
    AND ci.expires_at > NOW()
  
  ORDER BY joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_company_team_members(UUID) TO authenticated;
