# Company Profile Setup System

This document describes the company profile setup system implemented in the RostrIQ application.

## Overview

The company profile system allows company owners to create and manage their company profiles, while regular users can view company information. The system integrates with the existing user authentication and role management system.

## Features

### For Company Owners
- Create company profiles with comprehensive information
- Edit company details
- Manage company settings
- Invite team members (future feature)
- View company overview in dashboard

### For Regular Users
- View company information
- Access company-related features
- View company profile in read-only mode

## Database Schema

The system uses the following tables:

### `companies`
- Basic company information (name, description, industry, size)
- Contact details (website, email, phone)
- Address information
- Logo and branding
- Timestamps and status

### `company_members`
- Links users to companies
- Defines user roles within companies (owner, admin, member)
- Manages permissions
- Tracks membership status

### `user_profiles`
- User information and roles
- Links to companies through company_members table

## Components

### CompanyProfileForm
- Handles creation and editing of company profiles
- Includes validation and error handling
- Supports both create and edit modes
- Responsive design with proper form controls

### CompanyProfileView
- Displays company information in read-only format
- Shows company overview, details, and contact information
- Handles missing data gracefully
- Responsive layout for different screen sizes

### CompanyService
- Manages all company-related database operations
- Handles CRUD operations for companies
- Manages company member relationships
- Includes error handling and validation

## Pages

### `/setup-company`
- Company creation page for new owners
- Redirects existing company owners to dashboard
- Only accessible to users with 'owner' role

### `/company-profile`
- Company profile management page
- Owners can edit company information
- Regular users can view company details
- Redirects users without companies to setup

## User Flow

1. **User Registration**: User signs up and selects role
2. **Role Selection**: User chooses between 'user' and 'owner'
3. **Company Setup** (for owners): Owner creates company profile
4. **Dashboard Access**: User accesses dashboard with company context
5. **Profile Management**: Owners can edit, users can view

## Security Features

- Row Level Security (RLS) policies protect company data
- Users can only access companies they're members of
- Only company owners can edit company information
- Proper authentication checks on all routes

## Future Enhancements

- Company logo upload functionality
- Multiple company support for users
- Advanced permission system
- Company member invitation system
- Company analytics and reporting
- Integration with external business services

## Usage Examples

### Creating a Company
```typescript
const { company, error } = await CompanyService.createCompany(
  {
    name: "Acme Corp",
    description: "Leading technology solutions",
    industry: "Technology",
    size: "51-200 employees"
  },
  userId
);
```

### Fetching User Companies
```typescript
const { companies, error } = await CompanyService.getUserCompanies(userId);
```

### Updating Company
```typescript
const { company, error } = await CompanyService.updateCompany(
  companyId,
  { description: "Updated description" }
);
```

## Dependencies

- Next.js 14+ with App Router
- Supabase for database and authentication
- TailwindCSS for styling
- React Hook Form for form management
- TypeScript for type safety

## Setup Instructions

1. Ensure database migrations are applied
2. Set up Supabase environment variables
3. Install required dependencies
4. Run the development server
5. Test the company creation flow

## Testing

The system includes comprehensive error handling and validation:
- Form validation for required fields
- Database error handling
- User permission checks
- Redirect logic for different user states

## Troubleshooting

Common issues and solutions:
- **Company not found**: Check user permissions and company membership
- **Form submission errors**: Verify required fields and data format
- **Permission denied**: Ensure user has appropriate role and company membership
- **Database errors**: Check Supabase connection and table permissions
