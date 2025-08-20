import { supabase } from '@/lib/supabase'
import type { 
  CompanyFunction, 
  CompanyFunctionAssignment, 
  CompanyFunctionView, 
  EmployeeFunctionView,
  CreateCompanyFunction,
  CreateCompanyFunctionAssignment,
  UpdateCompanyFunction,
  UpdateCompanyFunctionAssignment
} from '@/types/database'
import { TABLES } from '@/types/database'



export class CompanyFunctionsService {
  // Get all functions for a company
  static async getCompanyFunctions(companyId: string): Promise<CompanyFunctionView[]> {
    const { data, error } = await supabase
      .from(TABLES.COMPANY_FUNCTIONS_VIEW)
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching company functions:', error)
      throw new Error('Failed to fetch company functions')
    }

    return data || []
  }

  // Get a single function by ID
  static async getCompanyFunction(functionId: string): Promise<CompanyFunction | null> {
    const { data, error } = await supabase
      .from(TABLES.COMPANY_FUNCTIONS)
      .select('*')
      .eq('id', functionId)
      .single()

    if (error) {
      console.error('Error fetching company function:', error)
      throw new Error('Failed to fetch company function')
    }

    return data
  }

  // Create a new function
  static async createCompanyFunction(functionData: CreateCompanyFunction): Promise<CompanyFunction> {
    const { data, error } = await supabase
      .from(TABLES.COMPANY_FUNCTIONS)
      .insert(functionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating company function:', error)
      throw new Error('Failed to create company function')
    }

    return data
  }

  // Update a function
  static async updateCompanyFunction(
    functionId: string, 
    updates: UpdateCompanyFunction
  ): Promise<CompanyFunction> {
    const { data, error } = await supabase
      .from(TABLES.COMPANY_FUNCTIONS)
      .update(updates)
      .eq('id', functionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating company function:', error)
      throw new Error('Failed to update company function')
    }

    return data
  }

  // Delete a function (soft delete by setting is_active to false)
  static async deleteCompanyFunction(functionId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.COMPANY_FUNCTIONS)
      .update({ is_active: false })
      .eq('id', functionId)

    if (error) {
      console.error('Error deleting company function:', error)
      throw new Error('Failed to delete company function')
    }
  }

  // Get all employees assigned to a specific function
  static async getEmployeesByFunction(functionId: string): Promise<EmployeeFunctionView[]> {
    const { data, error } = await supabase
      .from(TABLES.EMPLOYEE_FUNCTIONS_VIEW)
      .select('*')
      .eq('function_id', functionId)
      .eq('is_active', true)
      .order('first_name')

    if (error) {
      console.error('Error fetching employees by function:', error)
      throw new Error('Failed to fetch employees by function')
    }

    return data || []
  }

  // Get all functions assigned to a specific employee
  static async getEmployeeFunctions(userId: string, companyId: string): Promise<EmployeeFunctionView[]> {
    const { data, error } = await supabase
      .from(TABLES.EMPLOYEE_FUNCTIONS_VIEW)
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })

    if (error) {
      console.error('Error fetching employee functions:', error)
      throw new Error('Failed to fetch employee functions')
    }

    return data || []
  }

  // Assign a function to an employee
  static async assignFunctionToEmployee(
    assignmentData: CreateCompanyFunctionAssignment
  ): Promise<CompanyFunctionAssignment> {
    const { data, error } = await supabase
      .from(TABLES.COMPANY_FUNCTION_ASSIGNMENTS)
      .insert(assignmentData)
      .select()
      .single()

    if (error) {
      console.error('Error assigning function to employee:', error)
      throw new Error('Failed to assign function to employee')
    }

    return data
  }

  // Update function assignment
  static async updateFunctionAssignment(
    assignmentId: string,
    updates: UpdateCompanyFunctionAssignment
  ): Promise<CompanyFunctionAssignment> {
    const { data, error } = await supabase
      .from(TABLES.COMPANY_FUNCTION_ASSIGNMENTS)
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating function assignment:', error)
      throw new Error('Failed to update function assignment')
    }

    return data
  }

  // Remove function assignment from employee
  static async removeFunctionFromEmployee(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.COMPANY_FUNCTION_ASSIGNMENTS)
      .update({ is_active: false })
      .eq('id', assignmentId)

    if (error) {
      console.error('Error removing function from employee:', error)
      throw new Error('Failed to remove function from employee')
    }
  }

  // Set primary function for an employee
  static async setPrimaryFunction(userId: string, companyId: string, functionId: string): Promise<void> {
    // First, remove primary status from all other functions for this employee
    const { error: updateError } = await supabase
      .from(TABLES.COMPANY_FUNCTION_ASSIGNMENTS)
      .update({ is_primary: false })
      .eq('user_id', userId)
      .eq('company_id', companyId)

    if (updateError) {
      console.error('Error updating primary function status:', updateError)
      throw new Error('Failed to update primary function status')
    }

    // Then set the new primary function
    const { error: setError } = await supabase
      .from(TABLES.COMPANY_FUNCTION_ASSIGNMENTS)
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('function_id', functionId)

    if (setError) {
      console.error('Error setting primary function:', setError)
      throw new Error('Failed to set primary function')
    }
  }

  // Get all employees with their functions for a company
  static async getAllEmployeesWithFunctions(companyId: string): Promise<EmployeeFunctionView[]> {
    const { data, error } = await supabase
      .from(TABLES.EMPLOYEE_FUNCTIONS_VIEW)
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('first_name')

    if (error) {
      console.error('Error fetching employees with functions:', error)
      throw new Error('Failed to fetch employees with functions')
    }

    return data || []
  }
}
