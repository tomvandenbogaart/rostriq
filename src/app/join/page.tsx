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
  }, [token]);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      setUserEmail(user.email);
    }
  };

  const checkInvitation = async () => {
    try {
      const { data, error } = await invitationsService.getInvitationByToken(token!);
      if (error) throw error;
      if (!data) throw new Error('Invalid or expired invitation');

      setInvitation(data);
      if (data.companies) {
        setCompany(data.companies as Company);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push(`/signin?redirect=/join?token=${token}`);
  };

  const handleSignUp = () => {
    router.push(`/signup?redirect=/join?token=${token}`);
  };

  const handleJoinCompany = async () => {
    if (!invitation || !isAuthenticated) return;

    setIsJoining(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Accept the invitation
      const { error: acceptError } = await invitationsService.acceptInvitation(token!, user.id);
      if (acceptError) throw acceptError;

      // Add user to company members
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: invitation.company_id,
          user_id: user.id,
          role: invitation.role,
        });

      if (memberError) throw memberError;

      // Refresh header count for company owners
      window.dispatchEvent(new CustomEvent('refreshInvitationsCount'));
      
      // Redirect to dashboard
      router.push('/dashboard?joined=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is not valid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invitation Not Found</CardTitle>
            <CardDescription>
              The invitation you're looking for could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join {company.name}</CardTitle>
          <CardDescription>
            You've been invited to join this company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{company.name}</h3>
            {company.description && (
              <p className="text-sm text-gray-600">{company.description}</p>
            )}
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="outline">{invitation.role}</Badge>
              <Badge variant="secondary">
                Expires {new Date(invitation.expires_at).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {/* Invitation Message */}
          {invitation.message && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">"{invitation.message}"</p>
            </div>
          )}

          {/* Status Messages */}
          {isExpired && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-800">
                This invitation has expired. Please contact the company owner for a new invitation.
              </p>
            </div>
          )}

          {!isAuthenticated && !isExpired && (
            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-sm text-yellow-800">
                You need to sign in or create an account to join this company.
              </p>
            </div>
          )}

          {isAuthenticated && userEmail !== invitation.invited_email && (
            <div className="bg-orange-50 p-3 rounded-md">
              <p className="text-sm text-orange-800">
                This invitation was sent to {invitation.invited_email}, but you're signed in as {userEmail}.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isAuthenticated && !isExpired && (
              <>
                <Button onClick={handleSignIn} className="w-full">
                  Sign In
                </Button>
                <Button onClick={handleSignUp} variant="outline" className="w-full">
                  Create Account
                </Button>
              </>
            )}

            {isAuthenticated && !isExpired && userEmail === invitation.invited_email && (
              <Button 
                onClick={handleJoinCompany} 
                disabled={isJoining}
                className="w-full"
              >
                {isJoining ? 'Joining Company...' : 'Join Company'}
              </Button>
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
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
