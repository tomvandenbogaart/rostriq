-- Migration: Fix RLS policies for RPC functions
-- Description: Update RLS policies to allow the get_company_team_members RPC function to work properly

-- Drop the restrictive policy that only allows users to view their own memberships
DROP POLICY IF EXISTS "Company members can view their company memberships" ON public.company_members;

-- Create a more permissive policy that allows company members to view all members in their company
CREATE POLICY "Company members can view company members" ON public.company_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm2
            JOIN public.user_profiles up ON cm2.user_id = up.id
            WHERE cm2.company_id = company_members.company_id
            AND up.user_id = auth.uid()
            AND cm2.is_active = true
        )
    );

-- Also ensure user_profiles can be read by company members
CREATE POLICY "Company members can view user profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE up.user_id = auth.uid()
            AND cm.is_active = true
        )
    );
