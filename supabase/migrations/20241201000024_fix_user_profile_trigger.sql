-- Fix handle_new_user function to copy first_name and last_name from auth user metadata
-- This migration updates the trigger function to extract user metadata and store it in user_profiles

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to copy user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id, 
        email, 
        first_name, 
        last_name, 
        role
    )
    VALUES (
        NEW.id, 
        NEW.email,
        CASE 
            WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL AND trim(NEW.raw_user_meta_data->>'first_name') != '' 
            THEN trim(NEW.raw_user_meta_data->>'first_name')
            ELSE NULL
        END,
        CASE 
            WHEN NEW.raw_user_meta_data->>'last_name' IS NOT NULL AND trim(NEW.raw_user_meta_data->>'last_name') != '' 
            THEN trim(NEW.raw_user_meta_data->>'last_name')
            ELSE NULL
        END,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing user profiles that might be missing first_name and last_name
-- by fetching them from auth.users metadata
UPDATE public.user_profiles 
SET 
    first_name = COALESCE(auth_users.raw_user_meta_data->>'first_name', ''),
    last_name = COALESCE(auth_users.raw_user_meta_data->>'last_name', '')
FROM auth.users as auth_users
WHERE user_profiles.user_id = auth_users.id
    AND (user_profiles.first_name IS NULL OR user_profiles.first_name = '')
    AND (user_profiles.last_name IS NULL OR user_profiles.last_name = '')
    AND (auth_users.raw_user_meta_data->>'first_name' IS NOT NULL 
         OR auth_users.raw_user_meta_data->>'last_name' IS NOT NULL);
