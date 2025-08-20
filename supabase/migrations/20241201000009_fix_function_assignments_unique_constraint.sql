-- Fix unique constraint for company_function_assignments to only apply to active records
-- This allows reassigning functions after soft deletion

-- Drop the existing unique constraint if it exists
ALTER TABLE public.company_function_assignments 
DROP CONSTRAINT IF EXISTS company_function_assignments_company_id_user_id_function_id_key;

-- Create a partial unique index that only applies to active records
-- This prevents duplicate active assignments while allowing reassignment after soft deletion
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_function_assignments_unique_active 
ON public.company_function_assignments(company_id, user_id, function_id) 
WHERE is_active = true;

-- Add a comment explaining the index
COMMENT ON INDEX idx_company_function_assignments_unique_active 
IS 'Partial unique index that only applies to active function assignments, allowing reassignment after soft deletion';
