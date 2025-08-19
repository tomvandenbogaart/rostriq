-- Seed script for testing company join requests
-- This script creates test users, company, and join request data

-- First, create auth users (this bypasses the normal signup flow for testing)
-- The trigger will automatically create user profiles
DO $$
DECLARE
    tom_auth_id UUID;
    boga_auth_id UUID;
    tom_profile_id UUID;
    boga_profile_id UUID;
    softomic_company_id UUID;
BEGIN
    -- Create auth users one by one to avoid conflicts
    -- The trigger will automatically create user profiles
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), 'tom@softomic.nl', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
    RETURNING id INTO tom_auth_id;
    
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), 'bogatom98@gmail.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
    RETURNING id INTO boga_auth_id;
    
    -- Wait a moment for the trigger to execute, then get the profile IDs
    -- The trigger automatically creates user profiles with basic info
    SELECT id INTO tom_profile_id FROM public.user_profiles WHERE user_id = tom_auth_id;
    SELECT id INTO boga_profile_id FROM public.user_profiles WHERE user_id = boga_auth_id;
    
    -- Update Tom's profile to be an owner with more details
    UPDATE public.user_profiles 
    SET role = 'owner', first_name = 'Tom', last_name = 'van den Bogaart', company_name = 'Softomic'
    WHERE id = tom_profile_id;

    -- Update Boga's profile with more details
    UPDATE public.user_profiles 
    SET first_name = 'Boga', last_name = 'Tom'
    WHERE id = boga_profile_id;
    
    -- Create the Softomic company
    INSERT INTO public.companies (id, name, description, industry, email)
    VALUES (
        gen_random_uuid(),
        'Softomic',
        'A software company focused on innovative solutions',
        'Technology',
        'tom@softomic.nl'
    ) RETURNING id INTO softomic_company_id;
    
    -- Add Tom as the company owner
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (softomic_company_id, tom_profile_id, 'owner');
    
    -- Create a join request from Boga to Softomic
    INSERT INTO public.company_join_requests (company_id, user_id, message, status)
    VALUES (
        softomic_company_id,
        boga_profile_id,
        'Hi! I would like to join your company. I have experience in software development and would love to contribute to your projects.',
        'pending'
    );
    
    RAISE NOTICE 'Seed data created successfully:';
    RAISE NOTICE 'Tom auth ID: %', tom_auth_id;
    RAISE NOTICE 'Boga auth ID: %', boga_auth_id;
    RAISE NOTICE 'Tom profile ID: %', tom_profile_id;
    RAISE NOTICE 'Boga profile ID: %', boga_profile_id;
    RAISE NOTICE 'Softomic company ID: %', softomic_company_id;
END $$;
