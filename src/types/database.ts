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

// New company functions interfaces
export interface CompanyFunction {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CompanyFunctionAssignment {
  id: string;
  company_id: string;
  user_id: string;
  function_id: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by?: string;
  is_active: boolean;
}

export interface CompanyFunctionView {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_name: string;
  created_by_name?: string;
  created_by_last_name?: string;
  assigned_employees_count: number;
}

export interface EmployeeFunctionView {
  id: string;
  company_id: string;
  user_id: string;
  function_id: string;
  is_primary: boolean;
  assigned_at: string;
  is_active: boolean;
  company_name: string;
  function_name: string;
  function_description?: string;
  function_color: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
  company_role: string;
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
  COMPANY_FUNCTIONS: 'company_functions',
  COMPANY_FUNCTION_ASSIGNMENTS: 'company_function_assignments',
  USER_COMPANY_VIEW: 'user_company_view',
  COMPANY_FUNCTIONS_VIEW: 'company_functions_view',
  EMPLOYEE_FUNCTIONS_VIEW: 'employee_functions_view',
} as const;

// Helper type for creating new records
export type CreateUserProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type CreateCompany = Omit<Company, 'id' | 'created_at' | 'updated_at'>;
export type CreateCompanyMember = Omit<CompanyMember, 'id' | 'joined_at'>;
export type CreateCompanyJoinRequest = Omit<CompanyJoinRequest, 'id' | 'created_at' | 'updated_at' | 'reviewed_by' | 'reviewed_at'>;
export type CreateCompanyFunction = Omit<CompanyFunction, 'id' | 'created_at' | 'updated_at'>;
export type CreateCompanyFunctionAssignment = Omit<CompanyFunctionAssignment, 'id' | 'assigned_at'>;

// Update types (partial updates)
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateCompany = Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateCompanyMember = Partial<Omit<CompanyMember, 'id' | 'company_id' | 'user_id' | 'joined_at'>>;
export type UpdateCompanyJoinRequest = Partial<Omit<CompanyJoinRequest, 'id' | 'company_id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateCompanyFunction = Partial<Omit<CompanyFunction, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
export type UpdateCompanyFunctionAssignment = Partial<Omit<CompanyFunctionAssignment, 'id' | 'company_id' | 'user_id' | 'function_id' | 'assigned_at'>>;
