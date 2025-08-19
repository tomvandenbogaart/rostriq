# Supabase Migration Setup for RostrIQ

This document explains how to set up the database schema for user roles and company management in RostrIQ.

## Prerequisites

- Supabase CLI installed and configured
- Local Supabase instance running (or access to your Supabase project)

## Migration Files

### 1. Database Schema Migration
- **File**: `supabase/migrations/20241201000000_create_user_profiles_and_roles.sql`
- **Purpose**: Creates the complete database schema for user management

### 2. TypeScript Types
- **File**: `src/types/database.ts`
- **Purpose**: Type-safe database operations

### 3. Database Service
- **File**: `src/lib/database.ts`
- **Purpose**: Centralized database operations

## Database Schema Overview

### Tables Created

1. **`user_profiles`** - User information and roles
   - `id` - Unique identifier
   - `user_id` - Links to Supabase auth.users
   - `email` - User's email address
   - `role` - Enum: 'user' or 'owner'
   - `first_name`, `last_name` - User's name
   - `company_name` - Associated company
   - `phone`, `avatar_url` - Additional user info
   - `is_active` - Account status
   - `created_at`, `updated_at` - Timestamps

2. **`companies`** - Company information
   - `id` - Unique identifier
   - `name` - Company name
   - `description`, `industry`, `size` - Company details
   - `website`, `logo_url` - Company assets
   - `address`, `city`, `state`, `country`, `postal_code` - Location
   - `phone`, `email` - Contact information
   - `is_active` - Company status
   - `created_at`, `updated_at` - Timestamps

3. **`company_members`** - User-company relationships
   - `id` - Unique identifier
   - `company_id` - References companies table
   - `user_id` - References user_profiles table
   - `role` - User's role in company: 'owner', 'admin', 'member'
   - `permissions` - JSONB field for granular permissions
   - `joined_at` - When user joined company
   - `is_active` - Membership status

### Views Created

1. **`user_company_view`** - Simplified view of user-company relationships

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Policies** ensure users can only access their own data
- **Company owners** can manage their companies and members
- **Team members** can view company information they belong to

## Applying the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to your project directory
cd /path/to/rostriq

# Apply the migration to your local Supabase instance
supabase db reset

# Or apply specific migration
supabase migration up
```

### Option 2: Manual Application

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL

### Option 3: Production Deployment

```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration to production
supabase db push
```

## Post-Migration Setup

### 1. Verify Tables Created

Check that all tables were created successfully:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'companies', 'company_members');

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'companies', 'company_members');
```

### 2. Test the Trigger

Create a test user to verify the automatic profile creation:

```sql
-- This should automatically create a user profile
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('test@example.com', crypt('password123', gen_salt('bf')), now(), now(), now());

-- Check if profile was created
SELECT * FROM user_profiles WHERE email = 'test@example.com';
```

### 3. Test RLS Policies

```sql
-- Test user profile access (should work for authenticated user)
SELECT * FROM user_profiles WHERE user_id = auth.uid();

-- Test company access (should work for company members)
SELECT * FROM companies WHERE id IN (
  SELECT company_id FROM company_members 
  WHERE user_id = (SELECT id FROM user_profiles WHERE user_id = auth.uid())
);
```

## Troubleshooting

### Common Issues

1. **Migration fails with permission errors**
   - Ensure you're connected as a superuser or have necessary privileges
   - Check if RLS policies are too restrictive

2. **Trigger not working**
   - Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
   - Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

3. **RLS policies blocking access**
   - Temporarily disable RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
   - Test access, then re-enable and adjust policies

### Debug Queries

```sql
-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check trigger functions
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Next Steps

After applying the migration:

1. **Update your application code** to use the new database service
2. **Test user registration** and role selection
3. **Implement company creation** for company owners
4. **Add team member invitations** functionality
5. **Set up proper error handling** for database operations

## Support

If you encounter issues:

1. Check the Supabase logs: `supabase logs`
2. Verify your database connection
3. Test individual SQL statements in the Supabase SQL editor
4. Check the Supabase documentation for RLS and policies

## Schema Diagram

```
auth.users (Supabase Auth)
    ↓
user_profiles (role: user/owner)
    ↓
company_members ← companies
    ↓
user_company_view (simplified view)
```

This migration provides a solid foundation for user role management and company structure in RostrIQ.
