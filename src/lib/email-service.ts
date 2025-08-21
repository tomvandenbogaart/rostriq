// Email service for sending company invitations
// In production, this would integrate with services like SendGrid, Mailgun, AWS SES, etc.

export interface InvitationEmailData {
  to: string;
  companyName: string;
  inviterName: string;
  invitationUrl: string;
  role: string;
  message?: string;
  expiresAt: string;
}

export class EmailService {
  /**
   * Send a company invitation email
   * This is a placeholder implementation - in production you'd integrate with a real email service
   */
  static async sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would call your email service API
      // For now, we'll just log the email details
      console.log('📧 Sending invitation email:', {
        to: data.to,
        company: data.companyName,
        inviter: data.inviterName,
        role: data.role,
        expires: data.expiresAt,
        url: data.invitationUrl
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // In production, you would:
      // 1. Call your email service API (SendGrid, Mailgun, etc.)
      // 2. Handle any API errors
      // 3. Log the email for tracking
      // 4. Return success/failure status

      return { success: true };
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate the email HTML content for invitations
   */
  static generateInvitationEmailHTML(data: InvitationEmailData): string {
    const formattedExpiry = new Date(data.expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're invited to join ${data.companyName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">You're Invited!</h1>
            <h2 style="color: #1f2937; margin-bottom: 15px;">Join ${data.companyName}</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi there! <strong>${data.inviterName}</strong> has invited you to join 
              <strong>${data.companyName}</strong> as a <strong>${data.role}</strong>.
            </p>

            ${data.message ? `
              <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: left;">
                <p style="margin: 0; font-style: italic; color: #0277bd;">
                  "${data.message}"
                </p>
              </div>
            ` : ''}

            <div style="margin: 30px 0;">
              <a href="${data.invitationUrl}" 
                 style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              <strong>Important:</strong> This invitation expires on ${formattedExpiry}.
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, please contact ${data.inviterName} directly.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
            <p>This invitation was sent by ${data.companyName}</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate plain text version of the invitation email
   */
  static generateInvitationEmailText(data: InvitationEmailData): string {
    const formattedExpiry = new Date(data.expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
You're Invited to Join ${data.companyName}

Hi there! ${data.inviterName} has invited you to join ${data.companyName} as a ${data.role}.

${data.message ? `Personal message: "${data.message}"` : ''}

To accept this invitation, click the following link:
${data.invitationUrl}

Important: This invitation expires on ${formattedExpiry}.

If you have any questions, please contact ${data.inviterName} directly.

---
This invitation was sent by ${data.companyName}
If you didn't expect this invitation, you can safely ignore this email.
    `.trim();
  }
}
