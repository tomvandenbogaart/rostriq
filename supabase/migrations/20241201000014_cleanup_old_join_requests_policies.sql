-- Clean up old join requests references from RLS policies
-- This migration removes all policies and functions that reference the old company_join_requests table

-- Drop the policy that references company_join_requests
DROP POLICY IF EXISTS "Company owners can view join request sender profiles" ON public.user_profiles;

-- Drop the function that references company_join_requests
DROP FUNCTION IF EXISTS public.is_company_owner_for_join_request(UUID);

-- Add a simple policy for company owners to view team member profiles
-- This allows company owners to view profiles of their team members
CREATE POLICY "Company owners can view team member profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 
            FROM public.company_members cm1
            JOIN public.company_members cm2 ON cm1.company_id = cm2.company_id
            JOIN public.user_profiles up ON cm1.user_id = up.id
            WHERE cm2.user_id = user_profiles.id
            AND up.user_id = auth.uid()
            AND cm1.role IN ('owner', 'admin')
            AND cm1.is_active = true
            AND cm2.is_active = true
        )
    );
