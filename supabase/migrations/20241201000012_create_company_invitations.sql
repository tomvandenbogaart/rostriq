-- Create company_invitations table to replace company_join_requests
-- This implements a secure invitation system where only company owners can invite users

CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES user_profiles(id),
    invitation_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES user_profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for company_invitations
-- Company owners and admins can create invitations for their companies
CREATE POLICY "Company owners can create invitations" ON company_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM company_members cm
            JOIN user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_invitations.company_id
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

-- Company owners and admins can view invitations for their companies
CREATE POLICY "Company owners can view invitations" ON company_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            JOIN user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_invitations.company_id
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

-- Company owners and admins can update invitations for their companies
CREATE POLICY "Company owners can update invitations" ON company_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            JOIN user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_invitations.company_id
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

-- Company owners and admins can delete invitations for their companies
CREATE POLICY "Company owners can delete invitations" ON company_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            JOIN user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_invitations.company_id
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

-- Users can view invitations sent to their email (for joining)
CREATE POLICY "Users can view invitations sent to their email" ON company_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.email = company_invitations.invited_email
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_company_invitations_company_id ON company_invitations(company_id);
CREATE INDEX idx_company_invitations_invited_email ON company_invitations(invited_email);
CREATE INDEX idx_company_invitations_invitation_token ON company_invitations(invitation_token);
CREATE INDEX idx_company_invitations_status ON company_invitations(status);
CREATE INDEX idx_company_invitations_expires_at ON company_invitations(expires_at);

-- Create partial unique index to prevent duplicate pending invitations
CREATE UNIQUE INDEX idx_company_invitations_unique_pending 
ON company_invitations(company_id, invited_email) 
WHERE status = 'pending';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_invitations_updated_at
    BEFORE UPDATE ON company_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_company_invitations_updated_at();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE company_invitations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job or trigger to run this function periodically
-- For now, we'll create a function that can be called manually
-- In production, you might want to set up a cron job to run this every hour

-- Grant necessary permissions
GRANT ALL ON company_invitations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
