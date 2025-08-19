-- Make message field nullable in company_join_requests table
-- This allows for simpler join requests without requiring a message

-- Update existing records to set message to NULL if it's empty
UPDATE company_join_requests 
SET message = NULL 
WHERE message = '' OR message IS NULL;

-- Alter the column to be nullable (it's already nullable, but this makes it explicit)
-- The field is already nullable in the original schema, so this is just for clarity
COMMENT ON COLUMN company_join_requests.message IS 'Optional message from the user requesting to join the company';
