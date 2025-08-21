import { useState, useEffect } from 'react';
import { CompanyInvitationsService } from '@/lib/company-invitations-service';
import { supabase } from '@/lib/supabase';
import { CompanyInvitation, Company } from '@/types/database';

interface UseCompanyInvitationReturn {
  invitation: CompanyInvitation | null;
  company: Company | null;
  isLoading: boolean;
  error: string | null;
  isExpired: boolean;
  refreshInvitation: () => Promise<void>;
}

export function useCompanyInvitation(token: string | null): UseCompanyInvitationReturn {
  const [invitation, setInvitation] = useState<CompanyInvitation | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const invitationsService = new CompanyInvitationsService();

  const refreshInvitation = async () => {
    if (!token) {
      setError('No invitation token provided');
      setIsLoading(false);
      return;
    }

    try {
      // Validate token format first
      console.log('Validating token:', token);
      const isValid = invitationsService.isValidToken(token);
      console.log('Token validation result:', isValid);
      
      if (!isValid) {
        setError('Invalid invitation token format');
        setIsLoading(false);
        return;
      }

      const { data, error } = await invitationsService.getInvitationByToken(token);
      if (error) throw error;
      if (!data) throw new Error('Invalid or expired invitation');

      setInvitation(data);
      
      // Get company data separately since CompanyInvitation doesn't include company details
      if (data.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', data.company_id)
          .single();
        
        if (companyError) {
          console.error('Error loading company data:', companyError);
          setError('Failed to load company information');
          return;
        }
        
        if (companyData) {
          setCompany(companyData);
        } else {
          setError('Company not found');
          return;
        }
      } else {
        setError('Invalid invitation - missing company information');
        return;
      }
    } catch (err: any) {
      console.error('Error checking invitation:', err);
      if (err.code === 'PGRST116') {
        setError('Invitation not found or has expired');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load invitation. Please check the link and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshInvitation();
  }, [token]);

  const isExpired = invitation ? new Date(invitation.expires_at) < new Date() : false;

  return {
    invitation,
    company,
    isLoading,
    error,
    isExpired,
    refreshInvitation,
  };
}
