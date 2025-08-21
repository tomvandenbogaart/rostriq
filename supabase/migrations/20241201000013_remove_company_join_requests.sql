-- Remove the old company_join_requests system
-- This migration removes the old table and policies since we're replacing it with company_invitations

-- Drop the old table and all its dependencies
DROP TABLE IF EXISTS company_join_requests CASCADE;

-- Drop the old function that's no longer needed
DROP FUNCTION IF EXISTS update_company_join_requests_updated_at() CASCADE;
