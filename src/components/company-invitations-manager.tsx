'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyInvitationsService } from '@/lib/company-invitations-service';
import { CompanyInvitation, Company } from '@/types/database';

interface CompanyInvitationsManagerProps {
  companyId: string;
  company: Company;
}

export function CompanyInvitationsManager({ companyId, company }: CompanyInvitationsManagerProps) {
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    user_id: string;
    email: string;
    role: 'owner';
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    avatar_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null>(null);
  
  // Form state
  const [invitedEmail, setInvitedEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);

  const invitationsService = new CompanyInvitationsService();

  useEffect(() => {
    loadInvitations();
  }, [companyId]);

  // Get user profile from auth context instead of database
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
        if (user) {
          // Create a minimal profile from auth data instead of querying database
          setUserProfile({
            id: user.id,
            user_id: user.id,
            email: user.email || '',
            role: 'owner' as const, // Since they're managing company invitations, they're likely an owner
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            company_name: company?.name || '',
            phone: '',
            avatar_url: '',
            is_active: true,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at
          });
        }
      } catch (error) {
        console.error('Failed to get user profile:', error);
      }
    };
    
    getUserProfile();
  }, [company?.name]);

  const loadInvitations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await invitationsService.getCompanyInvitations(companyId);
      if (error) throw error;
      setInvitations(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const { data, error } = await invitationsService.createInvitation(
        companyId,
        invitedEmail,
        role,
        message || undefined,
        expiresInDays,
        company.name,
        `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || userProfile?.email || 'Company Owner'
      );

      if (error) throw error;

      // Reset form
      setInvitedEmail('');
      setMessage('');
      setRole('member');
      setExpiresInDays(7);

      // Reload invitations
      await loadInvitations();

      // Show success message (you might want to use a toast here)
      alert('Invitation sent successfully!');
      
      // Refresh header count
      window.dispatchEvent(new CustomEvent('refreshInvitationsCount'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const { error } = await invitationsService.cancelInvitation(invitationId);
      if (error) throw error;

      await loadInvitations();
      alert('Invitation cancelled successfully!');
      
      // Refresh header count
      window.dispatchEvent(new CustomEvent('refreshInvitationsCount'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      // Since resendInvitation doesn't exist, we'll create a new invitation instead
      // First get the existing invitation to copy its details
      const existingInvitation = invitations.find(inv => inv.id === invitationId);
      if (!existingInvitation) {
        throw new Error('Invitation not found');
      }

      // Create a new invitation with the same details
      const { error } = await invitationsService.createInvitation(
        companyId,
        existingInvitation.invited_email,
        existingInvitation.role,
        existingInvitation.message,
        expiresInDays,
        company.name,
        `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || userProfile?.email || 'Company Owner'
      );

      if (error) throw error;

      await loadInvitations();
      alert('Invitation resent successfully!');
      
      // Refresh header count
      window.dispatchEvent(new CustomEvent('refreshInvitationsCount'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    if (status === 'accepted') {
      return <Badge variant="default" className="bg-green-500">Accepted</Badge>;
    }
    if (status === 'expired') {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    const isExpired = new Date(expiresAt) < new Date();
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Company Invitation</CardTitle>
          <CardDescription>
            Invite new members to join {company.name} by sending them an email invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitedEmail}
                  onChange={(e) => setInvitedEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expires">Expires In (Days)</Label>
                <Input
                  id="expires"
                  type="number"
                  min="1"
                  max="30"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                rows={3}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isCreating || !invitedEmail.trim()}>
              {isCreating ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage invitations that have been sent to potential team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No invitations have been sent yet.
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{invitation.invited_email}</div>
                      <div className="text-sm text-gray-500">
                        Role: {invitation.role} • Expires: {formatDate(invitation.expires_at)}
                      </div>
                      {invitation.message && (
                        <div className="text-sm text-gray-600 mt-2">
                          &ldquo;{invitation.message}&rdquo;
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.id)}
                        >
                          Resend
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
