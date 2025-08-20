-- Create company functions table for managing employee roles/functions
-- This allows company owners to create custom functions like "Dish Washing", "Food Preparation", etc.

-- Create company_functions table
CREATE TABLE IF NOT EXISTS public.company_functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6', -- Default blue color for UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    UNIQUE(company_id, name)
);

-- Create company_function_assignments table to assign functions to employees
CREATE TABLE IF NOT EXISTS public.company_function_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    function_id UUID REFERENCES public.company_functions(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT false, -- Whether this is the employee's primary function
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create a partial unique index that only applies to active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_function_assignments_unique_active 
ON public.company_function_assignments(company_id, user_id, function_id) 
WHERE is_active = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_functions_company_id ON public.company_functions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_functions_name ON public.company_functions(name);
CREATE INDEX IF NOT EXISTS idx_company_function_assignments_company_id ON public.company_function_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_function_assignments_user_id ON public.company_function_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_company_function_assignments_function_id ON public.company_function_assignments(function_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.company_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_function_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_functions
CREATE POLICY "Company members can view company functions" ON public.company_functions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_functions.company_id 
            AND up.user_id = auth.uid()
            AND cm.is_active = true
        )
    );

CREATE POLICY "Company owners and admins can manage company functions" ON public.company_functions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_functions.company_id 
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

-- Create RLS policies for company_function_assignments
CREATE POLICY "Company members can view function assignments" ON public.company_function_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_function_assignments.company_id 
            AND up.user_id = auth.uid()
            AND cm.is_active = true
        )
    );

CREATE POLICY "Company owners and admins can manage function assignments" ON public.company_function_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            JOIN public.user_profiles up ON cm.user_id = up.id
            WHERE cm.company_id = company_function_assignments.company_id 
            AND up.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
            AND cm.is_active = true
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_company_functions_updated_at
    BEFORE UPDATE ON public.company_functions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.company_functions TO anon, authenticated;
GRANT ALL ON public.company_function_assignments TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create a view for easier function management
CREATE OR REPLACE VIEW public.company_functions_view AS
SELECT 
    cf.id,
    cf.company_id,
    cf.name,
    cf.description,
    cf.color,
    cf.is_active,
    cf.created_at,
    cf.updated_at,
    c.name as company_name,
    up.first_name as created_by_name,
    up.last_name as created_by_last_name,
    COUNT(cfa.user_id) as assigned_employees_count
FROM public.company_functions cf
JOIN public.companies c ON cf.company_id = c.id
LEFT JOIN public.user_profiles up ON cf.created_by = up.id
LEFT JOIN public.company_function_assignments cfa ON cf.id = cfa.function_id AND cfa.is_active = true
GROUP BY cf.id, cf.company_id, cf.name, cf.description, cf.color, cf.is_active, cf.created_at, cf.updated_at, c.name, up.first_name, up.last_name;

-- Grant access to the view
GRANT SELECT ON public.company_functions_view TO anon, authenticated;

-- Create a view for employee function assignments
CREATE OR REPLACE VIEW public.employee_functions_view AS
SELECT 
    cfa.id,
    cfa.company_id,
    cfa.user_id,
    cfa.function_id,
    cfa.is_primary,
    cfa.assigned_at,
    cfa.is_active,
    c.name as company_name,
    cf.name as function_name,
    cf.description as function_description,
    cf.color as function_color,
    up.first_name,
    up.last_name,
    up.email,
    up.avatar_url,
    cm.role as company_role
FROM public.company_function_assignments cfa
JOIN public.companies c ON cfa.company_id = c.id
JOIN public.company_functions cf ON cfa.function_id = cf.id
JOIN public.user_profiles up ON cfa.user_id = up.id
JOIN public.company_members cm ON cfa.company_id = cm.company_id AND cfa.user_id = cm.user_id
WHERE cfa.is_active = true AND cf.is_active = true AND cm.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.employee_functions_view TO anon, authenticated;
