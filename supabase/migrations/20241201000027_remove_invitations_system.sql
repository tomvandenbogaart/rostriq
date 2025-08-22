-- Remove company invitations system and simplify for direct employee management
-- This migration removes the complex invitation system and simplifies the app to only allow company owners to add employees directly

-- Drop the company_invitations table
DROP TABLE IF EXISTS company_invitations CASCADE;

-- Drop related triggers and functions
DROP TRIGGER IF EXISTS trigger_update_invitation_status ON company_members;
DROP FUNCTION IF EXISTS update_invitation_status_on_membership() CASCADE;
DROP FUNCTION IF EXISTS update_company_invitations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS expire_old_invitations() CASCADE;

-- Drop related indexes
DROP INDEX IF EXISTS idx_company_invitations_company_id;
DROP INDEX IF EXISTS idx_company_invitations_invited_email;
DROP INDEX IF EXISTS idx_company_invitations_invitation_token;
DROP INDEX IF EXISTS idx_company_invitations_status;
DROP INDEX IF EXISTS idx_company_invitations_expires_at;
DROP INDEX IF EXISTS idx_company_invitations_unique_pending;

-- Simplify company_members table by removing invitation-related fields
ALTER TABLE company_members 
DROP COLUMN IF EXISTS is_pending_invitation,
DROP COLUMN IF EXISTS invitation_data;

-- Drop and recreate the team_members RPC function to remove invitation logic
DROP FUNCTION IF EXISTS get_company_team_members(UUID);

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
        cm.working_hours_start,
        cm.working_hours_end,
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

-- Create a function for company owners to add employees directly
CREATE OR REPLACE FUNCTION add_company_employee(
    company_id_param UUID,
    employee_email TEXT,
    employee_role TEXT DEFAULT 'member',
    employee_permissions JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    owner_profile_id UUID;
    new_employee_profile_id UUID;
    result JSONB;
BEGIN
    -- Check if the current user is an owner of the company
    SELECT cm.user_id INTO owner_profile_id
    FROM company_members cm
    JOIN user_profiles up ON cm.user_id = up.id
    WHERE cm.company_id = company_id_param
    AND up.user_id = auth.uid()
    AND cm.role = 'owner'
    AND cm.is_active = true;
    
    IF owner_profile_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only company owners can add employees'
        );
    END IF;
    
    -- Check if employee already exists in the company
    IF EXISTS (
        SELECT 1 FROM company_members cm
        JOIN user_profiles up ON cm.user_id = up.id
        WHERE cm.company_id = company_id_param
        AND up.email = employee_email
        AND cm.is_active = true
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Employee already exists in this company'
        );
    END IF;
    
    -- Find or create user profile for the employee
    SELECT id INTO new_employee_profile_id
    FROM user_profiles
    WHERE email = employee_email;
    
    IF new_employee_profile_id IS NULL THEN
        -- Create a new user profile for the employee
        INSERT INTO user_profiles (user_id, email, role, is_active)
        VALUES (gen_random_uuid(), employee_email, 'user', true)
        RETURNING id INTO new_employee_profile_id;
    END IF;
    
    -- Add employee to company
    INSERT INTO company_members (
        company_id,
        user_id,
        role,
        permissions,
        is_active
    ) VALUES (
        company_id_param,
        new_employee_profile_id,
        employee_role,
        employee_permissions,
        true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'employee_id', new_employee_profile_id,
        'message', 'Employee added successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION add_company_employee(UUID, TEXT, TEXT, JSONB) TO authenticated;

-- Create a function for company owners to remove employees
CREATE OR REPLACE FUNCTION remove_company_employee(
    company_id_param UUID,
    employee_profile_id UUID
)
RETURNS JSONB AS $$
DECLARE
    owner_profile_id UUID;
    employee_role TEXT;
    result JSONB;
BEGIN
    -- Check if the current user is an owner of the company
    SELECT cm.user_id INTO owner_profile_id
    FROM company_members cm
    JOIN user_profiles up ON cm.user_id = up.id
    WHERE cm.company_id = company_id_param
    AND up.user_id = auth.uid()
    AND cm.role = 'owner'
    AND cm.is_active = true;
    
    IF owner_profile_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only company owners can remove employees'
        );
    END IF;
    
    -- Check if employee exists and get their role
    SELECT cm.role INTO employee_role
    FROM company_members cm
    WHERE cm.company_id = company_id_param
    AND cm.user_id = employee_profile_id
    AND cm.is_active = true;
    
    IF employee_role IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Employee not found in this company'
        );
    END IF;
    
    -- Prevent removing the owner
    IF employee_role = 'owner' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot remove the company owner'
        );
    END IF;
    
    -- Soft delete the employee (deactivate)
    UPDATE company_members
    SET is_active = false
    WHERE company_id = company_id_param
    AND user_id = employee_profile_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Employee removed successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION remove_company_employee(UUID, UUID) TO authenticated;
