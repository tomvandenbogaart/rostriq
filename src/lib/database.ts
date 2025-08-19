import { supabase } from './supabase';
import { 
  UserProfile, 
  Company, 
  CompanyMember, 
  UserCompanyView,
  UserRole,
  CreateUserProfile,
  CreateCompany,
  CreateCompanyMember,
  UpdateUserProfile,
  UpdateCompany,
  TABLES
} from '@/types/database';

export class DatabaseService {
  // User Profile Operations
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return null;
    }
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ role })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return null;
    }
  }

  // Company Operations
  static async createCompany(companyData: CreateCompany): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANIES)
        .insert(companyData)
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createCompany:', error);
      return null;
    }
  }

  static async getCompany(companyId: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANIES)
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('Error fetching company:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCompany:', error);
      return null;
    }
  }

  static async getUserCompanies(userId: string): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANY_MEMBERS)
        .select(`
          company_id,
          companies (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching user companies:', error);
        return [];
      }

      return data?.flatMap(item => Array.isArray(item.companies) ? item.companies : [item.companies]).filter(Boolean) as Company[] || [];
    } catch (error) {
      console.error('Error in getUserCompanies:', error);
      return [];
    }
  }

  // Company Member Operations
  static async addCompanyMember(memberData: CreateCompanyMember): Promise<CompanyMember | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANY_MEMBERS)
        .insert(memberData)
        .select()
        .single();

      if (error) {
        console.error('Error adding company member:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addCompanyMember:', error);
      return null;
    }
  }

  static async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANY_MEMBERS)
        .select(`
          *,
          user_profiles (*)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching company members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCompanyMembers:', error);
      return [];
    }
  }

  // User Company View Operations
  static async getUserCompanyView(userId: string): Promise<UserCompanyView | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_COMPANY_VIEW)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user company view:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserCompanyView:', error);
      return null;
    }
  }

  // Role-based Operations
  static async isUserCompanyOwner(userId: string, companyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMPANY_MEMBERS)
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      return data.role === 'owner';
    } catch (error) {
      console.error('Error in isUserCompanyOwner:', error);
      return false;
    }
  }

  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.role || null;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  }

  // Utility Operations
  static async checkUserExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  static async deleteUserProfile(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteUserProfile:', error);
      return false;
    }
  }
}
