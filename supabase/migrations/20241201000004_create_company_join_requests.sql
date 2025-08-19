-- Create company_join_requests table
CREATE TABLE IF NOT EXISTS company_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one request per user per company
    UNIQUE(company_id, user_id)
);

-- Enable RLS
ALTER TABLE company_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies for company_join_requests
-- Users can create requests and view their own requests
CREATE POLICY "Users can create join requests" ON company_join_requests
    FOR INSERT WITH CHECK (auth.uid() = (
        SELECT user_id FROM user_profiles WHERE id = company_join_requests.user_id
    ));

CREATE POLICY "Users can view their own requests" ON company_join_requests
    FOR SELECT USING (auth.uid() = (
        SELECT user_id FROM user_profiles WHERE id = company_join_requests.user_id
    ));

-- Company owners and admins can view and update requests for their companies
CREATE POLICY "Company owners can view requests for their companies" ON company_join_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            JOIN user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_join_requests.company_id
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

CREATE POLICY "Company owners can update requests for their companies" ON company_join_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM company_members cm
            JOIN user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_join_requests.company_id
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_company_join_requests_company_id ON company_join_requests(company_id);
CREATE INDEX idx_company_join_requests_user_id ON company_join_requests(user_id);
CREATE INDEX idx_company_join_requests_status ON company_join_requests(status);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_join_requests_updated_at
    BEFORE UPDATE ON company_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_company_join_requests_updated_at();
