export type UserRole = 'user' | 'owner';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  permissions: Record<string, unknown>;
  joined_at: string;
  is_active: boolean;
}

export interface CompanyJoinRequest {
  id: string;
  company_id: string;
  user_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface UserCompanyView {
  user_profile_id: string;
  user_id: string;
  email: string;
  user_role: UserRole;
  first_name?: string;
  last_name?: string;
  company_id?: string;
  company_name?: string;
  company_role?: string;
  permissions?: Record<string, unknown>;
}

// Database table names for Supabase queries
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  COMPANIES: 'companies',
  COMPANY_MEMBERS: 'company_members',
  COMPANY_JOIN_REQUESTS: 'company_join_requests',
  USER_COMPANY_VIEW: 'user_company_view',
} as const;

// Helper type for creating new records
export type CreateUserProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type CreateCompany = Omit<Company, 'id' | 'created_at' | 'updated_at'>;
export type CreateCompanyMember = Omit<CompanyMember, 'id' | 'joined_at'>;
export type CreateCompanyJoinRequest = Omit<CompanyJoinRequest, 'id' | 'created_at' | 'updated_at' | 'reviewed_by' | 'reviewed_at'>;

// Update types (partial updates)
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateCompany = Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateCompanyMember = Partial<Omit<CompanyMember, 'id' | 'company_id' | 'user_id' | 'joined_at'>>;
export type UpdateCompanyJoinRequest = Partial<Omit<CompanyJoinRequest, 'id' | 'company_id' | 'user_id' | 'created_at' | 'updated_at'>>;
