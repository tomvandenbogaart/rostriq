-- Fix RLS infinite recursion issue
-- The previous policy creates infinite recursion because it references user_profiles within its own policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Company owners can view user profiles of join request senders" ON public.user_profiles;

-- Temporarily disable RLS on user_profiles to allow the seeding process
-- We'll add a proper solution later that doesn't cause recursion
-- For now, make sure basic policies work
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Add back the basic policies (if they don't exist)
DO $$ BEGIN
    CREATE POLICY "Users can view their own profile" ON public.user_profiles
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own profile" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own profile" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add a policy that allows service role to read all profiles (for admin operations)
CREATE POLICY "Service role can access all user profiles" ON public.user_profiles
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Add a simpler policy for company owners that doesn't cause recursion
-- This uses a security definer function to bypass RLS when needed
CREATE OR REPLACE FUNCTION public.is_company_owner_for_join_request(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.company_join_requests cjr
        JOIN public.company_members cm ON cjr.company_id = cm.company_id
        JOIN public.user_profiles up ON cm.user_id = up.id
        WHERE cjr.user_id = profile_id
        AND up.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    );
END;
$$;

-- Now create the policy using the function
CREATE POLICY "Company owners can view join request sender profiles" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_company_owner_for_join_request(user_profiles.id)
    );
