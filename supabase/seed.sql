-- Seed script for testing company join requests
-- This script creates test company and join request data
-- Note: Users should be created through the proper signup flow for authentication to work

-- Create the Softomic company
DO $$
DECLARE
    softomic_company_id UUID;
BEGIN
    -- Create the Softomic company
    INSERT INTO public.companies (id, name, description, industry, email)
    VALUES (
        gen_random_uuid(),
        'Softomic',
        'A software company focused on innovative solutions',
        'Technology',
        'tom@softomic.nl'
    ) RETURNING id INTO softomic_company_id;
    
    RAISE NOTICE 'Softomic company created with ID: %', softomic_company_id;
    RAISE NOTICE 'Note: Users should be created through the signup flow for proper authentication';
    RAISE NOTICE 'After creating users, you can manually link them to the company and create join requests';
END $$;
