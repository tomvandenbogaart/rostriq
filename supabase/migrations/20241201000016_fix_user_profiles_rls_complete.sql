-- Completely fix user profiles RLS policies to eliminate infinite recursion
-- This migration removes all problematic policies and creates clean, simple ones

-- Disable RLS temporarily to clean up
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can access all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Company owners can view team member profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Company owners can view join request sender profiles" ON public.user_profiles;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create only the essential, non-recursive policies
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

-- Note: We're intentionally NOT creating a policy for company members to view each other
-- This will be handled at the application level or through specific queries that bypass RLS
-- when necessary, to avoid the infinite recursion issue
