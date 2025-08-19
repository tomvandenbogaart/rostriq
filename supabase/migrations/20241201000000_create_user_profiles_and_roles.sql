-- Create user profiles table with roles
-- This migration creates a comprehensive user management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'owner');

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table for company owners
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    size TEXT,
    website TEXT,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_members table to link users to companies
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(company_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for companies
CREATE POLICY "Company owners can view their companies" ON public.companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = companies.id 
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Company owners can update their companies" ON public.companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = companies.id 
            AND up.user_id = auth.uid()
            AND cm.role = 'owner'
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
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Create RLS policies for company_members
CREATE POLICY "Company members can view their company memberships" ON public.company_members
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
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.companies TO anon, authenticated;
GRANT ALL ON public.company_members TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert some sample data for testing (optional)
-- INSERT INTO public.companies (name, description, industry) VALUES 
--     ('Sample Company', 'A sample company for testing', 'Technology');

-- Create a view for easier user-company relationships
CREATE OR REPLACE VIEW public.user_company_view AS
SELECT 
    up.id as user_profile_id,
    up.user_id,
    up.email,
    up.role as user_role,
    up.first_name,
    up.last_name,
    c.id as company_id,
    c.name as company_name,
    cm.role as company_role,
    cm.permissions
FROM public.user_profiles up
LEFT JOIN public.company_members cm ON up.id = cm.user_id
LEFT JOIN public.companies c ON cm.company_id = c.id;

-- Grant access to the view
GRANT SELECT ON public.user_company_view TO anon, authenticated;
