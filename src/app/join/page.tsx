'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyInvitationsService } from '@/lib/company-invitations-service';
import { supabase } from '@/lib/supabase';
import { CompanyInvitation, Company } from '@/types/database';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<CompanyInvitation | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const invitationsService = new CompanyInvitationsService();

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setIsLoading(false);
      return;
    }

    checkInvitation();
    checkAuthStatus();
    
    // Add a more frequent auth check for when users return from signup
    const authCheckInterval = setInterval(checkAuthStatus, 2000); // Check every 2 seconds
    
    return () => clearInterval(authCheckInterval);
  }, [token]);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('checkAuthStatus: User authenticated:', user.email);
      setIsAuthenticated(true);
      setUserEmail(user.email || null);
    } else {
      console.log('checkAuthStatus: No user found');
      setIsAuthenticated(false);
      setUserEmail(null);
    }
  };

  // Add a manual refresh button for when auth state gets out of sync
  const handleRefreshAuth = async () => {
    console.log('Manual auth refresh triggered');
    await checkAuthStatus();
  };

  const checkInvitation = async () => {
    try {
      // Validate token format first
      if (!invitationsService.isValidToken(token!)) {
        setError('Invalid invitation token format');
        setIsLoading(false);
        return;
      }

      const { data, error } = await invitationsService.getInvitationByToken(token!);
      if (error) throw error;
      if (!data) throw new Error('Invalid or expired invitation');

      setInvitation(data);
      
      // Get company data separately since CompanyInvitation doesn't include company details
      if (data.company_id) {
        console.log('Loading company data for company_id:', data.company_id);
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
          console.log('Company data loaded successfully:', companyData);
          setCompany(companyData);
        } else {
          console.error('No company data found for company_id:', data.company_id);
          setError('Company not found');
          return;
        }
      } else {
        console.error('Invitation missing company_id');
        setError('Invalid invitation - missing company information');
        return;
      }
      
      // Debug logging
      console.log('Invitation loaded:', data);
      console.log('Company data:', company);
      console.log('Is authenticated:', isAuthenticated);
      console.log('User email:', userEmail);
      console.log('Invited email:', data.invited_email);
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

  const handleSignIn = () => {
    const prefEmail = invitation?.invited_email || '';
    router.push(`/signin?redirect=/join?token=${token}${prefEmail ? `&email=${encodeURIComponent(prefEmail)}` : ''}`);
  };

  const handleSignUp = () => {
    const prefEmail = invitation?.invited_email || '';
    router.push(`/signup?redirect=/join?token=${token}${prefEmail ? `&email=${encodeURIComponent(prefEmail)}` : ''}`);
  };

  const handleJoinCompany = async () => {
    if (!invitation || !isAuthenticated) {
      console.log('handleJoinCompany: Missing invitation or not authenticated', { invitation: !!invitation, isAuthenticated });
      return;
    }

    console.log('handleJoinCompany: Starting company join process');
    setIsJoining(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('handleJoinCompany: User authenticated:', user.id);

      // Ensure a user_profile exists and get its id
      const { data: existingProfile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('user_id', user.id)
        .single();

      let userProfileId = existingProfile?.id as string | undefined;

      if (!userProfileId) {
        console.log('handleJoinCompany: Creating new user profile');
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
        console.log('handleJoinCompany: Created user profile:', userProfileId);
      } else {
        console.log('handleJoinCompany: Found existing user profile:', userProfileId);
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
          // Continue with manual company membership creation as fallback
          console.log('Continuing with fallback company membership creation');
        } else {
          console.log('Invitation accepted successfully via service');
        }
      } catch (acceptError) {
        console.error('Error calling invitation service:', acceptError);
        // Continue with manual company membership creation as fallback
        console.log('Continuing with fallback company membership creation');
      }

      // Upsert into company_members (avoid duplicate error)
      console.log('Creating company membership:', {
        company_id: invitation.company_id,
        user_id: userProfileId,
        role: invitation.role
      })
      
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
        console.error('handleJoinCompany: Company membership creation failed:', memberError);
        throw memberError;
      }
      
      console.log('Company membership created successfully')
      
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Auto-accept when authenticated and emails match, and invite valid
  const [hasAutoAccepted, setHasAutoAccepted] = useState(false);
  const [isAutoAccepting, setIsAutoAccepting] = useState(false);
  
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
      handleJoinCompany().finally(() => {
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

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-2 border-border">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Join a Company</CardTitle>
            <CardDescription className="text-base">
              You need an invitation to join a company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-primary mb-1">How to Join a Company</p>
                  <p className="text-sm text-foreground">
                    To join a company, you need an invitation link from a company owner. The invitation link should look like: <code className="bg-muted px-1 py-0.5 rounded text-xs">/join?token=abc123</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <Button onClick={() => router.push('/signup')} className="w-full max-w-xs" size="lg">
                  Create Account First
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Create an account, then use an invitation link to join a company
                </p>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => router.push('/setup-company')} 
                  variant="outline"
                  className="w-full max-w-xs" 
                  size="lg"
                >
                  Create Your Own Company
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Start your own company and invite others to join
                </p>
              </div>

              <Button 
                onClick={() => router.push('/')} 
                variant="ghost" 
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Loading Invitation</h2>
            <p className="text-muted-foreground">Please wait while we verify your invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-2 border-destructive/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-destructive">Invalid Invitation</CardTitle>
            <CardDescription className="text-base">
              This invitation link is not valid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
            <Button onClick={() => router.push('/')} className="w-full" size="lg">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-2xl border-2 border-destructive/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-destructive">Invitation Not Found</CardTitle>
            <CardDescription className="text-base">
              The invitation you're looking for could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full" size="lg">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAlreadyMember = userEmail === invitation.invited_email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-border">
        <CardHeader className="text-center pb-8">
          {/* Company Logo */}
          {company.logo_url ? (
            <div className="mx-auto w-24 h-24 mb-6">
              <img
                src={company.logo_url}
                alt={`${company.name} logo`}
                className="w-full h-full object-contain rounded-xl border-2 border-border shadow-lg"
                onError={(e) => {
                  // Hide logo if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          )}
          <CardTitle className="text-3xl font-bold">Join {company.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            You've been invited to join this company
          </CardDescription>
          
          {/* Company Details & Invitation Info */}
          <div className="mt-6 space-y-4">
            {company.description && (
              <p className="text-muted-foreground max-w-md mx-auto">{company.description}</p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                Expires {new Date(invitation.expires_at).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">

          {/* Invitation Message */}
          {invitation.message && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div>
                  <p className="font-medium text-primary mb-1">Personal Message</p>
                  <p className="text-sm text-foreground">"{invitation.message}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isExpired && (
            <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium text-destructive mb-1">Invitation Expired</p>
                  <p className="text-sm text-foreground">
                    This invitation has expired. Please contact the company owner for a new invitation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated && !isExpired && (
            <div className="bg-warning/5 border border-warning/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="font-medium text-warning mb-1">Authentication Required</p>
                  <p className="text-sm text-foreground">
                    You need to sign in or create an account to join this company.
                  </p>
                  {userEmail && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        If you just created an account, try refreshing the authentication state:
                      </p>
                      <Button 
                        onClick={handleRefreshAuth} 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                      >
                        Refresh Auth State
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && userEmail !== invitation.invited_email && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium text-orange-800 mb-1">Email Mismatch</p>
                  <p className="text-sm text-foreground">
                    This invitation was sent to <strong>{invitation.invited_email}</strong>, but you're signed in as <strong>{userEmail}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="space-y-2 text-xs">
              <p className="font-medium text-muted-foreground">Debug Info:</p>
              <div className="grid grid-cols-2 gap-2">
                <p>Is Authenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{isAuthenticated ? 'Yes' : 'No'}</span></p>
                <p>Is Expired: <span className={isExpired ? 'text-red-600' : 'text-green-600'}>{isExpired ? 'Yes' : 'No'}</span></p>
                <p>User Email: <span className="font-mono">{userEmail || 'Not set'}</span></p>
                <p>Invited Email: <span className="font-mono">{invitation.invited_email}</span></p>
                <p>Emails Match: <span className={userEmail === invitation.invited_email ? 'text-green-600' : 'text-red-600'}>{userEmail === invitation.invited_email ? 'Yes' : 'No'}</span></p>
                <p>Show Accept Button: <span className={isAuthenticated && !isExpired && userEmail === invitation.invited_email ? 'text-green-600' : 'text-red-600'}>{isAuthenticated && !isExpired && userEmail === invitation.invited_email ? 'Yes' : 'No'}</span></p>
                <p>Has Auto Accepted: <span className={hasAutoAccepted ? 'text-green-600' : 'text-red-600'}>{hasAutoAccepted ? 'Yes' : 'No'}</span></p>
                <p>Is Auto Accepting: <span className={isAutoAccepting ? 'text-green-600' : 'text-red-600'}>{isAutoAccepting ? 'Yes' : 'No'}</span></p>
                <p>Is Joining: <span className={isJoining ? 'text-green-600' : 'text-red-600'}>{isJoining ? 'Yes' : 'No'}</span></p>
                <p>Token: <span className="font-mono text-xs">{token}</span></p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {!isAuthenticated && !isExpired && (
              <div className="text-center">
                <Button onClick={handleSignUp} className="w-full max-w-xs" size="lg">
                  Create Account
                </Button>
              </div>
            )}

            {isAuthenticated && !isExpired && userEmail === invitation.invited_email && !hasAutoAccepted && (
              <div className="space-y-4">
                <Button 
                  onClick={handleJoinCompany} 
                  disabled={isJoining}
                  className="w-full"
                  size="lg"
                >
                  {isJoining ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      Joining Company...
                    </div>
                  ) : (
                    'Join Company'
                  )}
                </Button>
                
                <div className="text-center">
                  <Button 
                    onClick={handleRefreshAuth} 
                    variant="ghost" 
                    size="sm"
                  >
                    Refresh Authentication State
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    If the button above doesn&apos;t work, try refreshing the auth state
                  </p>
                </div>
              </div>
            )}

            {isAuthenticated && !isExpired && userEmail === invitation.invited_email && hasAutoAccepted && (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">
                    {isAutoAccepting ? 'Accepting invitation...' : 'Invitation accepted! Redirecting...'}
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={() => router.push('/')} 
              variant="ghost" 
              className="w-full"
            >
              Go Home
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium text-destructive mb-1">Error</p>
                  <p className="text-sm text-foreground">{error}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
