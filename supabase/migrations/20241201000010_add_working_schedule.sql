-- Add working schedule fields to company_members table
-- This allows companies to set specific working days and hours for each team member

-- Add working schedule columns to company_members table
ALTER TABLE public.company_members 
ADD COLUMN IF NOT EXISTS working_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
ADD COLUMN IF NOT EXISTS working_hours_start TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS working_hours_end TIME DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS is_part_time BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS working_schedule_notes TEXT;

-- Create an index for better performance when querying by working schedule
CREATE INDEX IF NOT EXISTS idx_company_members_working_days ON public.company_members USING GIN(working_days);

-- Add a check constraint to ensure working hours are valid
ALTER TABLE public.company_members 
ADD CONSTRAINT check_working_hours_valid 
CHECK (working_hours_start < working_hours_end);

-- Add a check constraint to ensure working days are valid day names
ALTER TABLE public.company_members 
ADD CONSTRAINT check_working_days_valid 
CHECK (
  working_days IS NULL OR 
  (array_length(working_days, 1) > 0 AND 
   working_days <@ ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
);

-- Create a function to validate working schedule updates
CREATE OR REPLACE FUNCTION validate_working_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure working days array is not empty
  IF NEW.working_days IS NULL OR array_length(NEW.working_days, 1) = 0 THEN
    RAISE EXCEPTION 'Working days cannot be empty';
  END IF;
  
  -- Ensure working hours are valid
  IF NEW.working_hours_start >= NEW.working_hours_end THEN
    RAISE EXCEPTION 'Working hours start must be before working hours end';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate working schedule on insert/update
CREATE TRIGGER validate_working_schedule_trigger
  BEFORE INSERT OR UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION validate_working_schedule();

-- Update the existing view to include working schedule information
DROP VIEW IF EXISTS public.user_company_view;

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
    cm.permissions,
    cm.working_days,
    cm.working_hours_start,
    cm.working_hours_end,
    cm.is_part_time,
    cm.working_schedule_notes
FROM public.user_profiles up
LEFT JOIN public.company_members cm ON up.id = cm.user_id
LEFT JOIN public.companies c ON cm.company_id = c.id;

-- Grant access to the updated view
GRANT SELECT ON public.user_company_view TO anon, authenticated;
