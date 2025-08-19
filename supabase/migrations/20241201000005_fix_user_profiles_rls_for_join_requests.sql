-- Fix RLS policies to allow company owners to read user profiles of join request senders
-- This migration adds a policy that allows company owners to view user profiles
-- of users who have sent join requests to their company

-- Add policy to allow company owners to read user profiles of join request senders
CREATE POLICY "Company owners can view user profiles of join request senders" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_join_requests cjr
            JOIN public.companies c ON cjr.company_id = c.id
            JOIN public.company_members cm ON c.id = cm.company_id
            JOIN public.user_profiles owner_profile ON cm.user_id = owner_profile.id
            WHERE cjr.user_id = user_profiles.id
            AND owner_profile.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );
