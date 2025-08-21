# Company Invitations System

This document describes the new company invitations system that replaces the old join requests approach.

## Overview

The new system implements a secure, invitation-based approach where only company owners and admins can invite users to join their companies. Users receive secure, expiring invitation links via email.

## Key Features

### 🔐 Security
- **Company owners only**: Only company owners and admins can send invitations
- **Secure tokens**: 64-character hexadecimal tokens for invitation links
- **Expiration**: Configurable expiration dates (1-30 days)
- **One-time use**: Tokens are invalidated after acceptance

### 📧 Email Integration
- **Professional emails**: Beautiful HTML and plain text email templates
- **Personalization**: Custom messages and company branding
- **Expiration notices**: Clear expiration information in emails

### 🚀 User Experience
- **One-click join**: Users click invitation links to join immediately
- **No approval delays**: Immediate company membership upon acceptance
- **Role assignment**: Pre-defined roles (member/admin) assigned during invitation

## Database Schema

### `company_invitations` Table

```sql
CREATE TABLE company_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES user_profiles(id),
    invitation_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES user_profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, invited_email, status) WHERE status = 'pending'
);
```

## API Endpoints

### Create Invitation
```typescript
POST /api/company-invitations
{
  companyId: string,
  invitedEmail: string,
  role: 'member' | 'admin',
  message?: string,
  expiresInDays: number
}
```

### Accept Invitation
```typescript
POST /api/company-invitations/accept
{
  token: string
}
```

### Get Company Invitations
```typescript
GET /api/company-invitations?companyId={companyId}
```

## Components

### CompanyInvitationsManager
- **Location**: `src/components/company-invitations-manager.tsx`
- **Purpose**: Company owners/admins manage invitations
- **Features**: 
  - Send new invitations
  - View pending invitations
  - Cancel/resend invitations
  - Track invitation status

### Join Page
- **Location**: `src/app/join/page.tsx`
- **Purpose**: Users accept invitations via secure links
- **Features**:
  - Validate invitation tokens
  - Handle authentication flow
  - Immediate company membership
  - Error handling for expired/invalid invitations

## Services

### CompanyInvitationsService
- **Location**: `src/lib/company-invitations-service.ts`
- **Methods**:
  - `createInvitation()` - Create and send invitation
  - `acceptInvitation()` - Accept invitation and join company
  - `getCompanyInvitations()` - Get all invitations for a company
  - `cancelInvitation()` - Cancel pending invitation
  - `resendInvitation()` - Resend with new token

### EmailService
- **Location**: `src/lib/email-service.ts`
- **Purpose**: Send invitation emails
- **Features**:
  - HTML and plain text email templates
  - Professional styling
  - Expiration information
  - Personalization support

## Migration from Old System

### What Was Removed
- `company_join_requests` table
- `CompanyJoinRequest` interface
- Join request approval/rejection workflow
- Manual user approval process

### What Was Added
- `company_invitations` table
- `CompanyInvitation` interface
- Secure invitation token system
- Email-based invitation flow
- Immediate membership upon acceptance

## Security Considerations

### Token Security
- 64-character hexadecimal tokens (256-bit entropy)
- Cryptographically secure random generation
- One-time use only
- Configurable expiration

### Access Control
- Only company owners/admins can create invitations
- Row-level security (RLS) policies
- Invitation validation on acceptance

### Email Security
- Secure invitation links
- Expiration warnings
- Company verification

## Usage Examples

### Sending an Invitation
```typescript
const invitationsService = new CompanyInvitationsService();

const { data, error } = await invitationsService.createInvitation(
  companyId,
  'colleague@company.com',
  'member',
  'Welcome to our team!',
  7, // expires in 7 days
  'Acme Corp',
  'John Doe'
);
```

### Accepting an Invitation
```typescript
// User clicks invitation link: /join?token=abc123...
const { data, error } = await invitationsService.acceptInvitation(token, userId);
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Email Service Integration
To integrate with a real email service, update `EmailService.sendInvitationEmail()`:

```typescript
// Example with SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: data.to,
  from: 'noreply@yourcompany.com',
  subject: `You're invited to join ${data.companyName}`,
  html: EmailService.generateInvitationEmailHTML(data),
  text: EmailService.generateInvitationEmailText(data),
};

await sgMail.send(msg);
```

## Testing

### Seed Data
The updated seed script creates test invitations:
```bash
npm run seed
```

### Test Users
- **tom@softomic.nl** - Company Owner
- **bogatom98@gmail.com** - Invited Member
- **sarah.johnson@email.com** - Invited Member
- **mike.chen@email.com** - Invited Admin

## Future Enhancements

### Planned Features
- Bulk invitation sending
- Invitation templates
- Analytics and tracking
- Integration with HR systems
- Advanced role management

### Performance Optimizations
- Database indexing for large invitation volumes
- Email queuing for high-volume sending
- Caching for invitation validation
- Background job processing

## Support

For questions or issues with the invitation system, please refer to:
- Database migrations in `supabase/migrations/`
- Component documentation in `src/components/`
- Service implementations in `src/lib/`
- Type definitions in `src/types/database.ts`
