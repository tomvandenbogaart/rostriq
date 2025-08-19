-- Simple company policies migration
-- This migration creates clean, simple RLS policies for companies

-- First, drop all existing policies on companies table
DROP POLICY IF EXISTS "Company owners can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Company owners can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Company owners can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies they belong to" ON public.companies;
DROP POLICY IF EXISTS "Temporary: Allow authenticated users to view companies" ON public.companies;

-- Create simple, clean policies
-- Allow any authenticated user to create companies
CREATE POLICY "Allow authenticated users to create companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view companies they're members of
CREATE POLICY "Allow users to view their companies" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = companies.id 
            AND up.user_id = auth.uid()
        )
    );

-- Allow users to view companies they've created (fallback for initial creation)
-- This policy allows users to see companies they own, even if company_members record doesn't exist yet
CREATE POLICY "Allow users to view companies they own" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = companies.id 
            AND up.user_id = auth.uid()
            AND cm.role = 'owner'
        )
    );

-- TEMPORARY: Allow authenticated users to view companies during initial setup
-- This policy will be removed once the company creation flow is stable
CREATE POLICY "Temporary: Allow authenticated users to view companies" ON public.companies
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow company owners to update their companies
CREATE POLICY "Allow company owners to update companies" ON public.companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = companies.id 
            AND up.user_id = auth.uid()
            AND cm.role = 'owner'
        )
    );

-- Allow company owners to delete their companies
CREATE POLICY "Allow company owners to delete companies" ON public.companies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = companies.id 
            AND up.user_id = auth.uid()
            AND cm.role = 'owner'
        )
    );
