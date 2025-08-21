'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CompanyInvitationsService } from '@/lib/company-invitations-service';
import { Company } from '@/types/database';

interface InvitationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  company: Company;
  onInvitationSent?: () => void;
}

export function InvitationDialog({ 
  isOpen, 
  onClose, 
  companyId, 
  company, 
  onInvitationSent 
}: InvitationDialogProps) {
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

  // Get user profile from auth context
  const getUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      if (user) {
        setUserProfile({
          id: user.id,
          user_id: user.id,
          email: user.email || '',
          role: 'owner' as const,
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
  }, [company?.name]);

  // Initialize user profile when dialog opens
  React.useEffect(() => {
    const initUserProfile = async () => {
      if (isOpen && !userProfile) {
        await getUserProfile();
      }
    };
    initUserProfile();
  }, [isOpen, userProfile, getUserProfile]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    // Make sure we have user profile before proceeding
    if (!userProfile) {
      await getUserProfile();
    }

    if (!userProfile) {
      setError('Unable to get user information. Please try again.');
      setIsCreating(false);
      return;
    }

    try {
      const { error } = await invitationsService.createInvitation(
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

      // Close dialog and notify parent
      onClose();
      if (onInvitationSent) {
        onInvitationSent();
      }

      // Show success message
      alert('Invitation sent successfully!');
      
      // Refresh header count
      window.dispatchEvent(new CustomEvent('refreshInvitationsCount'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setInvitedEmail('');
    setMessage('');
    setRole('member');
    setExpiresInDays(7);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-2xl border-2 border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Invite Team Member</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Invite a new member to join {company.name} by sending them an email invitation.
          </p>

          <form onSubmit={handleCreateInvitation} className="space-y-4">
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

            <div className="flex items-center gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isCreating || !invitedEmail.trim()}
                className="flex-1"
              >
                {isCreating ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
