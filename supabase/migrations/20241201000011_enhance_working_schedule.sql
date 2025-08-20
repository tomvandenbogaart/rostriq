-- Enhance working schedule to support per-day start/end times
-- This migration replaces the simple working_hours_start/end with a flexible per-day schedule

-- Add new column for per-day schedule (JSON format)
ALTER TABLE public.company_members 
ADD COLUMN IF NOT EXISTS daily_schedule JSONB DEFAULT '{}';

-- Create a function to calculate total weekly hours from daily_schedule
CREATE OR REPLACE FUNCTION calculate_weekly_hours(daily_schedule JSONB)
RETURNS NUMERIC AS $$
DECLARE
    day_key TEXT;
    day_data JSONB;
    start_time TIME;
    end_time TIME;
    daily_hours NUMERIC;
    total_hours NUMERIC := 0;
BEGIN
    -- Iterate through each day in the schedule
    FOR day_key IN SELECT jsonb_object_keys(daily_schedule) LOOP
        day_data := daily_schedule->day_key;
        
        -- Check if the day is enabled and has valid times
        IF (day_data->>'enabled')::BOOLEAN = true AND 
           day_data->>'start_time' IS NOT NULL AND 
           day_data->>'end_time' IS NOT NULL THEN
            
            start_time := (day_data->>'start_time')::TIME;
            end_time := (day_data->>'end_time')::TIME;
            
            -- Calculate hours for this day (handle overnight shifts)
            IF end_time > start_time THEN
                daily_hours := EXTRACT(EPOCH FROM (end_time - start_time)) / 3600;
            ELSE
                -- Overnight shift: add 24 hours to end time
                daily_hours := EXTRACT(EPOCH FROM ((end_time + INTERVAL '1 day') - start_time)) / 3600;
            END IF;
            
            total_hours := total_hours + daily_hours;
        END IF;
    END LOOP;
    
    RETURN total_hours;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for weekly hours
ALTER TABLE public.company_members 
ADD COLUMN IF NOT EXISTS weekly_hours NUMERIC GENERATED ALWAYS AS (calculate_weekly_hours(daily_schedule)) STORED;

-- Create index for better performance on schedule queries
CREATE INDEX IF NOT EXISTS idx_company_members_daily_schedule ON public.company_members USING GIN(daily_schedule);

-- Update the validation function to handle new schedule format
CREATE OR REPLACE FUNCTION validate_working_schedule()
RETURNS TRIGGER AS $$
DECLARE
    day_key TEXT;
    day_data JSONB;
    start_time TIME;
    end_time TIME;
BEGIN
    -- Validate daily_schedule if provided
    IF NEW.daily_schedule IS NOT NULL AND NEW.daily_schedule != '{}' THEN
        FOR day_key IN SELECT jsonb_object_keys(NEW.daily_schedule) LOOP
            day_data := NEW.daily_schedule->day_key;
            
            -- Check if day_key is valid
            IF day_key NOT IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') THEN
                RAISE EXCEPTION 'Invalid day key: %', day_key;
            END IF;
            
            -- If day is enabled, validate times
            IF (day_data->>'enabled')::BOOLEAN = true THEN
                IF day_data->>'start_time' IS NULL OR day_data->>'end_time' IS NULL THEN
                    RAISE EXCEPTION 'Start time and end time are required for enabled days';
                END IF;
                
                start_time := (day_data->>'start_time')::TIME;
                end_time := (day_data->>'end_time')::TIME;
                
                -- Times can be equal (indicating no work) but start can't be after end on same day
                -- unless it's an overnight shift (which we'll allow)
            END IF;
        END LOOP;
    END IF;
    
    -- Legacy validation for backward compatibility
    IF NEW.working_hours_start IS NOT NULL AND NEW.working_hours_end IS NOT NULL THEN
        IF NEW.working_hours_start >= NEW.working_hours_end THEN
            RAISE EXCEPTION 'Working hours start must be before working hours end';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the view to include new schedule fields
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
    cm.working_schedule_notes,
    cm.daily_schedule,
    cm.weekly_hours
FROM public.user_profiles up
LEFT JOIN public.company_members cm ON up.id = cm.user_id
LEFT JOIN public.companies c ON cm.company_id = c.id;

-- Grant access to the updated view
GRANT SELECT ON public.user_company_view TO anon, authenticated;

-- Migration helper: Convert existing simple schedules to daily_schedule format
UPDATE public.company_members 
SET daily_schedule = (
    SELECT jsonb_object_agg(
        day_name,
        jsonb_build_object(
            'enabled', true,
            'start_time', working_hours_start,
            'end_time', working_hours_end
        )
    )
    FROM unnest(COALESCE(working_days, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])) AS day_name
)
WHERE working_days IS NOT NULL 
    AND array_length(working_days, 1) > 0 
    AND working_hours_start IS NOT NULL 
    AND working_hours_end IS NOT NULL
    AND (daily_schedule IS NULL OR daily_schedule = '{}');
