-- Fix invitation acceptance by properly setting up RLS policies for invited users
-- This allows users to mark invitations as accepted when they join

-- Drop the existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can update invitations sent to their email" ON company_invitations;
DROP POLICY IF EXISTS "Users can accept their own invitations" ON company_invitations;

-- Users can update invitations sent to their email (for accepting)
-- Need both USING and WITH CHECK for UPDATE policies
CREATE POLICY "Users can update their own invitations" ON company_invitations
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.email = company_invitations.invited_email
            AND company_invitations.status = 'pending'
            AND company_invitations.expires_at > NOW()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.email = company_invitations.invited_email
        )
    );
