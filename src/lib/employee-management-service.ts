import { supabase } from './supabase';
import { CompanyMember, CreateCompanyMember } from '@/types/database';

export class EmployeeManagementService {
  /**
   * Add a new employee directly to a company (company owners only)
   */
  static async addEmployee(
    companyId: string,
    employeeName: string,
    role: 'member' | 'admin' = 'member',
    permissions: Record<string, unknown> = {}
  ): Promise<{ success: boolean; employee?: CompanyMember; error?: string }> {
    try {
      // Create a new user profile for the employee
      const { data: newUserProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: crypto.randomUUID(), // Generate a random UUID
          email: `${employeeName.toLowerCase().replace(/\s+/g, '.')}@${companyId}.local`, // Generate a local email
          role: 'user',
          first_name: employeeName.split(' ')[0] || employeeName,
          last_name: employeeName.split(' ').slice(1).join(' ') || '',
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Add employee to company
      const { data: newEmployee, error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: newUserProfile.id,
          role: role,
          permissions: permissions,
          is_active: true
        })
        .select()
        .single();

      if (memberError) {
        // Clean up the user profile if member creation fails
        await supabase.from('user_profiles').delete().eq('id', newUserProfile.id);
        return { success: false, error: memberError.message };
      }

      return { success: true, employee: newEmployee };
    } catch (error) {
      return { success: false, error: 'Failed to add employee' };
    }
  }

  /**
   * Remove an employee from a company (company owners only)
   */
  static async removeEmployee(
    companyId: string,
    employeeProfileId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('remove_company_employee', {
        company_id_param: companyId,
        employee_profile_id: employeeProfileId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || !data.success) {
        return { success: false, error: data?.error || 'Failed to remove employee' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to remove employee' };
    }
  }

  /**
   * Get all employees for a company
   */
  static async getCompanyEmployees(companyId: string): Promise<{ employees: CompanyMember[]; error?: string }> {
    try {
      const { data: employees, error } = await supabase
        .from('company_members')
        .select(`
          *,
          user_profiles (
            email,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) {
        return { employees: [], error: error.message };
      }

      return { employees: employees || [] };
    } catch (error) {
      return { employees: [], error: 'Failed to fetch employees' };
    }
  }

  /**
   * Update employee role and permissions
   */
  static async updateEmployeeRole(
    companyId: string,
    employeeProfileId: string,
    newRole: 'member' | 'admin',
    newPermissions: Record<string, unknown> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if the current user is an owner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      // Check if current user is owner
      const { data: currentUserMember } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .single();

      if (!currentUserMember || currentUserMember.role !== 'owner') {
        return { success: false, error: 'Only company owners can update employee roles' };
      }

      // Prevent changing owner role
      const { data: targetEmployee } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', employeeProfileId)
        .eq('is_active', true)
        .single();

      if (targetEmployee?.role === 'owner') {
        return { success: false, error: 'Cannot change owner role' };
      }

      // Update the employee role and permissions
      const { error: updateError } = await supabase
        .from('company_members')
        .update({
          role: newRole,
          permissions: newPermissions
        })
        .eq('company_id', companyId)
        .eq('user_id', employeeProfileId)
        .eq('is_active', true);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update employee role' };
    }
  }

  /**
   * Update employee working schedule
   */
  static async updateEmployeeSchedule(
    companyId: string,
    employeeProfileId: string,
    schedule: {
      working_days?: string[];
      working_hours_start?: string;
      working_hours_end?: string;
      is_part_time?: boolean;
      working_schedule_notes?: string;
      daily_schedule?: Record<string, any>;
      weekly_hours?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if the current user is an owner or admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      // Check if current user is owner or admin
      const { data: currentUserMember } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .single();

      if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
        return { success: false, error: 'Only company owners and admins can update employee schedules' };
      }

      // Update the employee schedule
      const { error: updateError } = await supabase
        .from('company_members')
        .update(schedule)
        .eq('company_id', companyId)
        .eq('user_id', employeeProfileId)
        .eq('is_active', true);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update employee schedule' };
    }
  }
}
