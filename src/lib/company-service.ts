import { supabase } from './supabase';
import { Company, CreateCompany, UpdateCompany, CompanyMember, CreateCompanyMember, DailySchedule } from '@/types/database';

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
  static async getUserCompanies(authUserId: string): Promise<{ companies: Company[]; error: string | null }> {
    try {
      // First get the user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', authUserId)
        .single();

      if (profileError || !userProfile) {
        return { companies: [], error: 'User profile not found' };
      }

      // Get companies where the user is a member
      const { data: companyMembers, error: membersError } = await supabase
        .from('company_members')
        .select(`
          company_id,
          companies (*)
        `)
        .eq('user_id', userProfile.id)
        .eq('is_active', true);

      if (membersError) {
        return { companies: [], error: membersError.message };
      }

      // Extract companies from the joined data and filter active ones
      const companies = companyMembers
        .map(member => member.companies as unknown as Company)
        .filter(company => company && company.is_active);

      return { companies, error: null };
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
  static async isCompanyOwner(companyId: string, authUserId: string): Promise<{ isOwner: boolean; error: string | null }> {
    try {
      // First get the user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', authUserId)
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

  // Check if user can view invitations (is owner or admin)
  static async canViewInvitations(companyId: string, authUserId: string): Promise<{ canView: boolean; error: string | null }> {
    try {
      // First get the user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', authUserId)
        .single();

      if (profileError || !userProfile) {
        return { canView: false, error: 'User profile not found' };
      }

      const { data: member, error } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .single();

      if (error) {
        return { canView: false, error: error.message };
      }

      return { canView: member.role === 'owner' || member.role === 'admin', error: null };
    } catch (error) {
      return { canView: false, error: 'Failed to check permissions' };
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

  // Search companies by name
  static async searchCompanies(searchTerm: string): Promise<{ companies: Company[]; error: string | null }> {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) {
        return { companies: [], error: error.message };
      }

      return { companies, error: null };
    } catch (error) {
      return { companies: [], error: 'Failed to search companies' };
    }
  }









  // Get company members with user profile information
  static async getCompanyTeamMembers(companyId: string): Promise<{ members: (CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[]; error: string | null }> {
    try {
      // Get company members first
      const { data: membersData, error: membersError } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (membersError) {
        return { members: [], error: membersError.message };
      }

      if (!membersData || membersData.length === 0) {
        return { members: [], error: null };
      }

      // Get user profiles for all members
      const userProfileIds = membersData.map(member => member.user_id);

      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .in('id', userProfileIds);

      if (profilesError) {
        return { members: [], error: profilesError.message };
      }

      // Combine the data
      const membersWithProfiles = membersData.map(member => {
        const userProfile = userProfiles?.find(profile => profile.id === member.user_id);

        if (userProfile) {
          return {
            ...member,
            user_profile: {
              email: userProfile.email,
              first_name: userProfile.first_name || undefined,
              last_name: userProfile.last_name || undefined,
              avatar_url: userProfile.avatar_url || undefined
            }
          };
        } else {
          return {
            ...member,
            user_profile: { 
              email: 'No email available', 
              first_name: undefined, 
              last_name: undefined,
              avatar_url: undefined
            }
          };
        }
      });

      return { members: membersWithProfiles, error: null };
    } catch (error) {
      console.error('Error in getCompanyTeamMembers:', error);
      return { members: [], error: 'Failed to fetch team members' };
    }
  }

  // Remove a team member from the company
  static async removeTeamMember(companyId: string, teamMemberUserId: string, removedByUserProfileId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // removedByUserProfileId is already the user profile ID, so we can use it directly
      // Check if the user trying to remove is an owner or admin
      const { data: currentUserMember, error: memberCheckError } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', removedByUserProfileId)
        .eq('is_active', true)
        .single();

      if (memberCheckError || !currentUserMember) {
        return { success: false, error: 'User not found in company' };
      }

      if (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin') {
        return { success: false, error: 'Only owners and admins can remove team members' };
      }

      // Check if the user being removed is the owner
      const { data: memberToRemove, error: removeCheckError } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', teamMemberUserId)
        .eq('is_active', true)
        .single();

      if (removeCheckError || !memberToRemove) {
        return { success: false, error: 'Team member not found' };
      }

      if (memberToRemove.role === 'owner') {
        return { success: false, error: 'Cannot remove the company owner' };
      }

      // Deactivate the team member (soft delete)
      const { error: deactivateError } = await supabase
        .from('company_members')
        .update({ is_active: false })
        .eq('company_id', companyId)
        .eq('user_id', teamMemberUserId);

      if (deactivateError) {
        return { success: false, error: deactivateError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in removeTeamMember:', error);
      return { success: false, error: 'Failed to remove team member' };
    }
  }

  // Update team member working schedule
  static async updateTeamMemberSchedule(
    companyId: string, 
    teamMemberUserId: string, 
    updatedByUserProfileId: string, 
    schedule: {
      daily_schedule: DailySchedule;
      is_part_time: boolean;
      working_schedule_notes?: string;
    }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // updatedBy is already the user profile ID, so we can use it directly
      // Check if the user trying to update is an owner or admin
      const { data: currentUserMember, error: memberCheckError } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', updatedByUserProfileId)
        .eq('is_active', true)
        .single();

      if (memberCheckError || !currentUserMember) {
        return { success: false, error: 'User not found in company' };
      }

      if (currentUserMember.role !== 'owner' && currentUserMember.role !== 'admin') {
        return { success: false, error: 'Only owners and admins can update team member schedules' };
      }

      // Update the team member's working schedule
      const { error: updateError } = await supabase
        .from('company_members')
        .update({
          daily_schedule: schedule.daily_schedule,
          is_part_time: schedule.is_part_time,
          working_schedule_notes: schedule.working_schedule_notes
        })
        .eq('company_id', companyId)
        .eq('user_id', teamMemberUserId)
        .eq('is_active', true);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error in updateTeamMemberSchedule:', error);
      return { success: false, error: 'Failed to update team member schedule' };
    }
  }


}
