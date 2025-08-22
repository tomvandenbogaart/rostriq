-- Migration: Fix team members RPC function time type mismatch
-- Description: Update the get_company_team_members function to properly handle TIME columns

-- Drop the existing function
DROP FUNCTION IF EXISTS get_company_team_members(UUID);

-- Recreate the function with proper type casting for TIME columns
CREATE OR REPLACE FUNCTION get_company_team_members(company_id_param UUID)
RETURNS TABLE (
    id UUID,
    company_id UUID,
    user_id UUID,
    role TEXT,
    permissions JSONB,
    joined_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    working_days TEXT[],
    working_hours_start TEXT,
    working_hours_end TEXT,
    is_part_time BOOLEAN,
    working_schedule_notes TEXT,
    daily_schedule JSONB,
    weekly_hours NUMERIC,
    user_email TEXT,
    user_first_name TEXT,
    user_last_name TEXT,
    user_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.company_id,
        cm.user_id,
        cm.role,
        cm.permissions,
        cm.joined_at,
        cm.is_active,
        cm.working_days,
        COALESCE(cm.working_hours_start::TEXT, '') as working_hours_start,
        COALESCE(cm.working_hours_end::TEXT, '') as working_hours_end,
        cm.is_part_time,
        cm.working_schedule_notes,
        cm.daily_schedule,
        cm.weekly_hours,
        up.email as user_email,
        up.first_name as user_first_name,
        up.last_name as user_last_name,
        up.avatar_url as user_avatar_url
    FROM company_members cm
    JOIN user_profiles up ON cm.user_id = up.id
    WHERE cm.company_id = company_id_param
    AND cm.is_active = true
    ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_company_team_members(UUID) TO authenticated;
