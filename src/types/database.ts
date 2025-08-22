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

// Daily schedule structure for flexible per-day working hours
export interface DailyScheduleEntry {
  enabled: boolean;
  start_time?: string; // HH:MM:SS format
  end_time?: string;   // HH:MM:SS format
}

export interface DailySchedule {
  monday?: DailyScheduleEntry;
  tuesday?: DailyScheduleEntry;
  wednesday?: DailyScheduleEntry;
  thursday?: DailyScheduleEntry;
  friday?: DailyScheduleEntry;
  saturday?: DailyScheduleEntry;
  sunday?: DailyScheduleEntry;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  permissions: Record<string, unknown>;
  joined_at: string;
  is_active: boolean;
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  is_part_time?: boolean;
  working_schedule_notes?: string;
  daily_schedule?: DailySchedule;
  weekly_hours?: number;
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
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  is_part_time?: boolean;
  working_schedule_notes?: string;
  daily_schedule?: DailySchedule;
  weekly_hours?: number;
}

// Database table names for Supabase queries
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  COMPANIES: 'companies',
    COMPANY_MEMBERS: 'company_members',

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

export type CreateCompanyFunction = Omit<CompanyFunction, 'id' | 'created_at' | 'updated_at'>;
export type CreateCompanyFunctionAssignment = Omit<CompanyFunctionAssignment, 'id' | 'assigned_at'>;

// Update types (partial updates)
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateCompany = Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateCompanyMember = Partial<Omit<CompanyMember, 'id' | 'company_id' | 'user_id' | 'joined_at'>>;

export type UpdateCompanyFunction = Partial<Omit<CompanyFunction, 'id' | 'company_id' | 'created_at' | 'updated_at'>>;
export type UpdateCompanyFunctionAssignment = Partial<Omit<CompanyFunctionAssignment, 'id' | 'company_id' | 'user_id' | 'function_id' | 'assigned_at'>>;
