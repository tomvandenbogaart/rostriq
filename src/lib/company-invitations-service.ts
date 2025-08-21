import { supabase } from '@/lib/supabase';
import { CompanyInvitation } from '@/types/database';
import { EmailService } from './email-service';

type CompanyInvitationInsert = Omit<CompanyInvitation, 'id' | 'created_at' | 'updated_at' | 'invited_by' | 'accepted_at' | 'accepted_by' | 'status'> & {
  invited_by?: string;
  status?: 'pending' | 'accepted' | 'expired';
};

type CompanyInvitationUpdate = Partial<Pick<CompanyInvitation, 'status' | 'accepted_at' | 'accepted_by' | 'message' | 'role'>>;

export class CompanyInvitationsService {
  /**
   * Create a new company invitation and send email
   */
  async createInvitation(
    companyId: string,
    invitedEmail: string,
    role: 'member' | 'admin' = 'member',
    message?: string,
    expiresInDays: number = 7,
    companyName?: string,
    inviterName?: string
  ): Promise<{ data: CompanyInvitation | null; error: Error | null }> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitationData: CompanyInvitationInsert = {
      company_id: companyId,
      invited_email: invitedEmail.toLowerCase().trim(),
      role,
      message,
      expires_at: expiresAt.toISOString(),
      invitation_token: this.generateSecureToken(),
    };

    const { data, error } = await supabase
      .from('company_invitations')
      .insert(invitationData)
      .select()
      .single();

    if (error || !data) {
      return { data: null, error: error as Error };
    }

    // Send invitation email
    if (companyName && inviterName) {
      try {
        const invitationUrl = this.generateInvitationUrl(data.invitation_token);
        await EmailService.sendInvitationEmail({
          to: invitedEmail,
          companyName,
          inviterName,
          invitationUrl,
          role,
          message,
          expiresAt: data.expires_at,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
        // In production, you might want to queue failed emails for retry
      }
    }

    return { data, error: null };
  }

  /**
   * Get all pending invitations for a company
   */
  async getCompanyInvitations(companyId: string): Promise<{ data: CompanyInvitation[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    return { data, error: error as Error };
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<{ data: CompanyInvitation | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*, companies(*)')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    return { data, error: error as Error };
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(
    invitationId: string,
    acceptedBy: string,
    message?: string
  ): Promise<{ data: CompanyInvitation | null; error: Error | null }> {
    const updateData: CompanyInvitationUpdate = {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: acceptedBy,
      message,
    };

    const { data, error } = await supabase
      .from('company_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single();

    return { data, error: error as Error };
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(invitationId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('company_invitations')
      .delete()
      .eq('id', invitationId);

    return { error: error as Error };
  }

  /**
   * Update invitation message
   */
  async updateInvitationMessage(
    invitationId: string,
    message: string
  ): Promise<{ data: CompanyInvitation | null; error: Error | null }> {
    const updateData: CompanyInvitationUpdate = {
      message,
    };

    const { data, error } = await supabase
      .from('company_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single();

    return { data, error: error as Error };
  }

  /**
   * Get all invitations for a specific email
   */
  async getInvitationsByEmail(email: string): Promise<{ data: CompanyInvitation[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*, companies(*)')
      .eq('invited_email', email.toLowerCase().trim())
      .order('created_at', { ascending: false });

    return { data, error: error as Error };
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpiredInvitations(): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .rpc('expire_old_invitations');

    return { error: error as Error };
  }

  /**
   * Generate a secure random token for invitations
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate invitation URL
   */
  generateInvitationUrl(token: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'): string {
    return `${baseUrl}/join?token=${token}`;
  }

  /**
   * Validate invitation token format
   */
  isValidToken(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token);
  }
}
