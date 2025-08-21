-- Migration: Create invitation status update trigger
-- Description: Automatically updates company_invitations status to 'accepted' 
-- when a new company_members record is created, ensuring data consistency
-- between invitations and company memberships.

-- Create a function to update invitation status when company membership is created
CREATE OR REPLACE FUNCTION update_invitation_status_on_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the invitation status when someone joins the company
  UPDATE company_invitations 
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = NEW.user_id
  WHERE 
    company_id = NEW.company_id 
    AND status = 'pending'
    AND invited_email = (
      SELECT email FROM user_profiles WHERE id = NEW.user_id
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_update_invitation_status
  AFTER INSERT ON company_members
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_status_on_membership();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_invitation_status_on_membership() TO authenticated;
