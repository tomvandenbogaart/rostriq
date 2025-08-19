-- Fix RLS policy for company creation
-- This migration updates the RLS policies to allow authenticated users to create companies

-- Drop the restrictive policy that requires owner role
DROP POLICY IF EXISTS "Company owners can insert companies" ON public.companies;

-- The following policies already exist from the first migration:
-- - "Authenticated users can create companies" (INSERT)
-- - "Company owners can update their companies" (UPDATE)
-- - "Company owners can view their companies" (SELECT)
-- - "Company owners can manage company members" (ALL)

-- Also update the company members policy to be more permissive for initial setup
DROP POLICY IF EXISTS "Company owners can manage company members" ON public.company_members;

-- Create a more permissive policy for company members during initial setup
CREATE POLICY "Authenticated users can manage company members" ON public.company_members
    FOR ALL USING (
        auth.uid() IS NOT NULL
    );

-- The following policies already exist from the first migration:
-- - "Company members can view their company memberships" (SELECT)
-- - "Authenticated users can insert company members" (INSERT)
