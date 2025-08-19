import { supabase } from './supabase';
import { Company, CreateCompany, UpdateCompany, CompanyMember, CreateCompanyMember } from '@/types/database';

export class CompanyService {
  // Create a new company
  static async createCompany(companyData: CreateCompany, userId: string): Promise<{ company: Company | null; error: string | null }> {
    try {
      // First get the user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !userProfile) {
        return { company: null, error: 'User profile not found' };
      }

      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (companyError) {
        return { company: null, error: companyError.message };
      }

      // Then, create the company member relationship with owner role
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: userProfile.id,
          role: 'owner',
          permissions: { can_manage_company: true, can_manage_members: true },
          is_active: true
        } as CreateCompanyMember);

      if (memberError) {
        // If member creation fails, delete the company
        await supabase.from('companies').delete().eq('id', company.id);
        return { company: null, error: memberError.message };
      }

      return { company, error: null };
    } catch (error) {
      return { company: null, error: 'Failed to create company' };
    }
  }

  // Get company by ID
  static async getCompanyById(companyId: string): Promise<{ company: Company | null; error: string | null }> {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .eq('is_active', true)
        .single();

      if (error) {
        return { company: null, error: error.message };
      }

      return { company, error: null };
    } catch (error) {
      return { company: null, error: 'Failed to fetch company' };
    }
  }

  // Get companies for a user
  static async getUserCompanies(userId: string): Promise<{ companies: Company[]; error: string | null }> {
    try {
      // For now, just return empty array to avoid complex queries during setup
      // This will be enhanced once the basic flow works
      return { companies: [], error: null };
    } catch (error) {
      return { companies: [], error: 'Failed to fetch user companies' };
    }
  }

  // Update company
  static async updateCompany(companyId: string, updates: UpdateCompany): Promise<{ company: Company | null; error: string | null }> {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .select()
        .single();

      if (error) {
        return { company: null, error: error.message };
      }

      return { company, error: null };
    } catch (error) {
      return { company: null, error: 'Failed to update company' };
    }
  }

  // Delete company (soft delete)
  static async deleteCompany(companyId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: 'Failed to delete company' };
    }
  }

  // Check if user is company owner
  static async isCompanyOwner(companyId: string, userId: string): Promise<{ isOwner: boolean; error: string | null }> {
    try {
      // First get the user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !userProfile) {
        return { isOwner: false, error: 'User profile not found' };
      }

      const { data: member, error } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .single();

      if (error) {
        return { isOwner: false, error: error.message };
      }

      return { isOwner: member.role === 'owner', error: null };
    } catch (error) {
      return { isOwner: false, error: 'Failed to check ownership' };
    }
  }

  // Get company members
  static async getCompanyMembers(companyId: string): Promise<{ members: CompanyMember[]; error: string | null }> {
    try {
      const { data: members, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) {
        return { members: [], error: error.message };
      }

      return { members, error: null };
    } catch (error) {
      return { members: [], error: 'Failed to fetch company members' };
    }
  }
}
