'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmployeeManagementService } from '@/lib/employee-management-service';
import { CompanyMember, Company } from '@/types/database';
import { Trash2, Edit, UserPlus, AlertCircle } from 'lucide-react';

interface EmployeeManagementProps {
  companyId: string;
  company: Company;
  userRole?: 'owner' | 'admin' | 'member';
}

export function EmployeeManagement({ companyId, company, userRole }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<'member' | 'admin'>('member');

  useEffect(() => {
    loadEmployees();
  }, [companyId]);

  const loadEmployees = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { employees: employeeList, error } = await EmployeeManagementService.getCompanyEmployees(companyId);
      if (error) throw new Error(error);
      setEmployees(employeeList || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { success, error: addError } = await EmployeeManagementService.addEmployee(
        companyId,
        newEmployeeName,
        newEmployeeRole
      );

      if (!success) {
        throw new Error(addError || 'Failed to add employee');
      }

      // Reset form
      setNewEmployeeName('');
      setNewEmployeeRole('member');
      setSuccessMessage('Employee added successfully!');

      // Reload employees
      await loadEmployees();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveEmployee = async (employeeProfileId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to remove ${employeeName} from the company?`)) return;

    try {
      const { success, error: removeError } = await EmployeeManagementService.removeEmployee(
        companyId,
        employeeProfileId
      );

      if (!success) {
        throw new Error(removeError || 'Failed to remove employee');
      }

      setSuccessMessage('Employee removed successfully!');
      await loadEmployees();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: 'bg-red-500 text-white',
      admin: 'bg-blue-500 text-white',
      member: 'bg-gray-500 text-white'
    };
    
    return (
      <Badge className={variants[role as keyof typeof variants] || 'bg-gray-500 text-white'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading employees...</div>
      </div>
    );
  }

  // Only owners can manage employees
  if (userRole !== 'owner') {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          Employee management is restricted to company owners only.
        </div>
        <div className="text-sm text-muted-foreground">
          Contact your company owner to add or manage employees.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Employee
          </CardTitle>
          <CardDescription>
            Add new employees directly to {company.name} by entering their name. No email validation required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Employee Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Employee Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={newEmployeeRole}
                  onChange={(e) => setNewEmployeeRole(e.target.value as 'member' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                <UserPlus className="w-4 h-4" />
                {successMessage}
              </div>
            )}

            <Button type="submit" disabled={isAdding || !newEmployeeName.trim()}>
              {isAdding ? 'Adding Employee...' : 'Add Employee'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Employees</CardTitle>
          <CardDescription>
            Manage your current team members and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees have been added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                                      <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {employee.user_profile?.first_name && employee.user_profile?.last_name 
                            ? `${employee.user_profile.first_name} ${employee.user_profile.last_name}`
                            : employee.user_profile?.first_name || 'Employee'
                          }
                        </div>
                        <div className="text-sm text-gray-500">
                          Role: {getRoleBadge(employee.role)} • Joined: {formatDate(employee.joined_at)}
                        </div>
                        {employee.working_schedule_notes && (
                          <div className="text-sm text-gray-600 mt-2">
                            Schedule: {employee.working_schedule_notes}
                          </div>
                        )}
                      </div>
                    <div className="flex items-center space-x-2">
                      {employee.role !== 'owner' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveEmployee(employee.user_id, 
                            employee.user_profile?.first_name && employee.user_profile?.last_name 
                              ? `${employee.user_profile.first_name} ${employee.user_profile.last_name}`
                              : employee.user_profile?.first_name || 'Employee'
                          )}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
