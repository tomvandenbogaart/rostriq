-- Fix invitation acceptance by adding policy for invited users to update their own invitations
-- This allows users to mark invitations as accepted when they join

-- Users can update invitations sent to their email (for accepting)
CREATE POLICY "Users can update invitations sent to their email" ON company_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.email = company_invitations.invited_email
        )
    );

-- Also allow users to update the status to 'accepted' when they have a valid invitation
CREATE POLICY "Users can accept their own invitations" ON company_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.email = company_invitations.invited_email
            AND company_invitations.status = 'pending'
            AND company_invitations.expires_at > NOW()
        )
    );
