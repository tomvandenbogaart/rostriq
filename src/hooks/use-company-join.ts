import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyInvitationsService } from '@/lib/company-invitations-service';
import { supabase } from '@/lib/supabase';
import { CompanyInvitation } from '@/types/database';

interface UseCompanyJoinReturn {
  isJoining: boolean;
  error: string | null;
  hasAutoAccepted: boolean;
  isAutoAccepting: boolean;
  joinCompany: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export function useCompanyJoin(
  invitation: CompanyInvitation | null,
  isAuthenticated: boolean,
  userEmail: string | null,
): UseCompanyJoinReturn {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoAccepted, setHasAutoAccepted] = useState(false);
  const [isAutoAccepting, setIsAutoAccepting] = useState(false);

  const invitationsService = new CompanyInvitationsService();

  const refreshAuth = async (): Promise<void> => {
    await supabase.auth.getUser();
  };

  const joinCompany = async () => {
    if (!invitation || !isAuthenticated) {
      console.log('joinCompany: Missing invitation or not authenticated', { 
        invitation: !!invitation, 
        isAuthenticated 
      });
      return;
    }

    console.log('joinCompany: Starting company join process');
    setIsJoining(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('joinCompany: User authenticated:', user.id);

      // Ensure a user_profile exists and get its id
      const { data: existingProfile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('user_id', user.id)
        .single();

      let userProfileId = existingProfile?.id as string | undefined;

      if (!userProfileId) {
        console.log('joinCompany: Creating new user profile');
        // Create minimal profile
        const now = new Date().toISOString();
        const { data: createdProfile, error: createErr } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email || invitation.invited_email,
            role: 'user',
            is_active: true,
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single();
        if (createErr) throw createErr;
        userProfileId = createdProfile.id;
        console.log('joinCompany: Created user profile:', userProfileId);
      } else {
        console.log('joinCompany: Found existing user profile:', userProfileId);
      }

      // Accept the invitation using invitation.id and user_profile id
      if (!userProfileId) {
        throw new Error('Failed to create or retrieve user profile');
      }
      
      console.log('Accepting invitation:', invitation.id, 'for user profile:', userProfileId);
      
      try {
        const { error: acceptError } = await invitationsService.acceptInvitation(invitation.id, userProfileId);
        if (acceptError) {
          console.error('Invitation service accept failed:', acceptError);
          console.log('Continuing with fallback company membership creation');
        } else {
          console.log('Invitation accepted successfully via service');
        }
      } catch (acceptError) {
        console.error('Error calling invitation service:', acceptError);
        console.log('Continuing with fallback company membership creation');
      }

      // Upsert into company_members (avoid duplicate error)
      console.log('Creating company membership:', {
        company_id: invitation.company_id,
        user_id: userProfileId,
        role: invitation.role
      });
      
      const { error: memberError } = await supabase
        .from('company_members')
        .upsert({
          company_id: invitation.company_id,
          user_id: userProfileId,
          role: invitation.role,
          joined_at: new Date().toISOString(),
          is_active: true,
        }, { onConflict: 'company_id,user_id' });
      
      if (memberError) {
        console.error('joinCompany: Company membership creation failed:', memberError);
        throw memberError;
      }
      
      console.log('Company membership created successfully');
      
      // Verify the membership was created
      const { data: verifyMembership, error: verifyError } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', invitation.company_id)
        .eq('user_id', userProfileId)
        .single();
      
      if (verifyError || !verifyMembership) {
        console.error('Failed to verify company membership creation:', verifyError);
        throw new Error('Company membership creation verification failed');
      }
      
      console.log('Company membership verified:', verifyMembership);

      // Refresh header count for company owners
      window.dispatchEvent(new CustomEvent('refreshInvitationsCount'));
      
      // Since this user just accepted an invitation, they now have a company
      // Always redirect to dashboard where they can see their schedule
      router.push('/dashboard?joined=true');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  // Auto-accept when authenticated and emails match, and invite valid
  useEffect(() => {
    console.log('Auto-accept useEffect triggered:', {
      hasInvitation: !!invitation,
      isAuthenticated,
      hasAutoAccepted,
      isAutoAccepting,
      isJoining,
      userEmail,
      invitedEmail: invitation?.invited_email,
      emailsMatch: userEmail === invitation?.invited_email
    });
    
    if (!invitation || !isAuthenticated || hasAutoAccepted || isAutoAccepting || isJoining) {
      console.log('Auto-accept conditions not met, returning early');
      return;
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      console.log('Invitation is expired, not auto-accepting');
      return;
    }
    
    if (userEmail && userEmail === invitation.invited_email) {
      console.log('Auto-accepting invitation for:', userEmail);
      setIsAutoAccepting(true);
      setHasAutoAccepted(true);
      
      // Auto-accept the invitation
      joinCompany().finally(() => {
        setIsAutoAccepting(false);
      });
    } else {
      console.log('Emails do not match or userEmail is missing:', {
        userEmail,
        invitedEmail: invitation.invited_email,
        match: userEmail === invitation.invited_email
      });
    }
  }, [invitation, isAuthenticated, userEmail, hasAutoAccepted, isAutoAccepting, isJoining]);

  return {
    isJoining,
    error,
    hasAutoAccepted,
    isAutoAccepting,
    joinCompany,
    refreshAuth,
  };
}
