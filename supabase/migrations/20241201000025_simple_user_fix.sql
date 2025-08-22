-- Simple fix: revert to original trigger and manually update user data

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the original simple function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
