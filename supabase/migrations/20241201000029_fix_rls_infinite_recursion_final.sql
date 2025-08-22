-- Migration: Fix RLS infinite recursion issue
-- Description: Simplify RLS policies to eliminate circular dependencies between user_profiles and company_members

-- First, disable RLS temporarily to clean up
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can access all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Company members can view user profiles" ON public.user_profiles;

DROP POLICY IF EXISTS "Company members can view company members" ON public.company_members;
DROP POLICY IF EXISTS "Company owners can manage company members" ON public.company_members;
DROP POLICY IF EXISTS "Authenticated users can manage company members" ON public.company_members;
DROP POLICY IF EXISTS "Authenticated users can insert company members" ON public.company_members;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to access all profiles (for admin operations and triggers)
CREATE POLICY "Service role can access all user profiles" ON public.user_profiles
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Create simple, non-recursive policies for company_members
CREATE POLICY "Users can view company memberships they belong to" ON public.company_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.id = company_members.user_id
        )
    );

CREATE POLICY "Company owners can manage company members" ON public.company_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'owner'
        )
    );

-- Allow authenticated users to insert company members (for initial setup)
CREATE POLICY "Authenticated users can insert company members" ON public.company_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create a simple policy for companies that doesn't reference company_members
CREATE POLICY "Company owners can view their companies" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'owner'
        )
    );

CREATE POLICY "Company owners can update their companies" ON public.companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'owner'
        )
    );

CREATE POLICY "Company owners can insert companies" ON public.companies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'owner'
        )
    );

-- Allow authenticated users to create companies (for initial setup)
CREATE POLICY "Authenticated users can create companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
