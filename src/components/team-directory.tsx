'use client';

import { useState, useEffect, useRef } from 'react';
import { CompanyMember } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CompanyFunctionsService } from '@/lib/company-functions-service';
import { CompanyService } from '@/lib/company-service';
import type { CompanyFunctionView, EmployeeFunctionView, CreateCompanyFunctionAssignment } from '@/types/database';

interface TeamMemberWithProfile extends CompanyMember {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface TeamDirectoryProps {
  members: TeamMemberWithProfile[];
  isLoading?: boolean;
  error?: string | null;
  companyId: string;
  currentUserId: string;
  viewOnly?: boolean;
  onTeamMembersChange?: () => void;
}

export function TeamDirectory({ members, isLoading, error, companyId, currentUserId, viewOnly = false, onTeamMembersChange }: TeamDirectoryProps) {
  const [functions, setFunctions] = useState<CompanyFunctionView[]>([]);
  const [employeeFunctions, setEmployeeFunctions] = useState<EmployeeFunctionView[]>([]);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const currentOperationRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadFunctions();
  }, [companyId]);

  const loadFunctions = async () => {
    try {
      setIsLoadingFunctions(true);
      const [functionsData, employeeFunctionsData] = await Promise.all([
        CompanyFunctionsService.getCompanyFunctions(companyId),
        CompanyFunctionsService.getAllEmployeesWithFunctions(companyId),
      ]);
      setFunctions(functionsData);
      setEmployeeFunctions(employeeFunctionsData);
    } catch (error) {
      console.error('Error loading functions:', error);
    } finally {
      setIsLoadingFunctions(false);
    }
  };

  const handleAssignFunction = async (userId: string, functionId: string) => {
    try {
      setIsAssigning(true);
      const assignmentData: CreateCompanyFunctionAssignment = {
        company_id: companyId,
        user_id: userId,
        function_id: functionId,
        is_primary: false,
        assigned_by: currentUserId,
        is_active: true,
      };
      await CompanyFunctionsService.assignFunctionToEmployee(assignmentData);
      await loadFunctions();
    } catch (error) {
      console.error('Error assigning function:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveFunction = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this function assignment?')) {
      return;
    }

    try {
      await CompanyFunctionsService.removeFunctionFromEmployee(assignmentId);
      await loadFunctions();
    } catch (error) {
      console.error('Error removing function assignment:', error);
    }
  };

  const handleSetPrimaryFunction = async (userId: string, functionId: string) => {
    try {
      await CompanyFunctionsService.setPrimaryFunction(userId, companyId, functionId);
      await loadFunctions();
    } catch (error) {
      console.error('Error setting primary function:', error);
    }
  };

  const handleRemoveTeamMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await CompanyService.removeTeamMember(companyId, userId, currentUserId);
      if (result.success) {
        await loadFunctions(); // Refresh functions to reflect team member removal
        // Call the callback to refresh team members list
        if (onTeamMembersChange) {
          onTeamMembersChange();
        }
      } else {
        alert(`Failed to remove team member: ${result.error}`);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Failed to remove team member. Please try again.');
    }
  };

  const handleFunctionChange = async (userId: string, newFunctionId: string, currentFunctionName?: string) => {
    // Prevent overlapping operations
    if (currentOperationRef.current) {
      console.log('Operation already in progress, ignoring request');
      return;
    }
    
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the operation
    debounceTimeoutRef.current = setTimeout(async () => {
      await performFunctionChange(userId, newFunctionId, currentFunctionName);
    }, 300);
  };

  const performFunctionChange = async (userId: string, newFunctionId: string, currentFunctionName?: string) => {
    const operationId = `${userId}-${newFunctionId}-${Date.now()}`;
    currentOperationRef.current = operationId;
    
    const newFunction = functions.find(f => f.id === newFunctionId);
    const newFunctionName = newFunction?.name || 'Unknown function';
    
    // Check if the function is already assigned
    const memberFunctions = getMemberFunctions(userId);
    const isAlreadyAssigned = memberFunctions.some(f => f.function_id === newFunctionId);
    
    if (isAlreadyAssigned) {
      console.log('Function already assigned:', newFunctionName);
      currentOperationRef.current = null;
      return; // No need to do anything
    }
    
    if (currentFunctionName) {
      // Changing existing function
      if (!confirm(`Are you sure you want to change ${currentFunctionName} to ${newFunctionName}?`)) {
        currentOperationRef.current = null;
        return;
      }
    } else {
      // Assigning new function
      if (!confirm(`Are you sure you want to assign ${newFunctionName} to this team member?`)) {
        currentOperationRef.current = null;
        return;
      }
    }

    try {
      setIsAssigning(true);
      
      // First, remove all existing function assignments
      if (memberFunctions.length > 0) {
        console.log('Removing existing functions:', memberFunctions.map(f => f.function_name));
        
        // Remove existing function assignments one by one
        for (const func of memberFunctions) {
          try {
            await CompanyFunctionsService.removeFunctionFromEmployee(func.id);
            console.log('Removed function:', func.function_name);
          } catch (removeError) {
            console.error('Error removing function:', func.function_name, removeError);
            throw new Error(`Failed to remove existing function: ${func.function_name}`);
          }
        }
      }
      
      // Now assign the new function
      console.log('Assigning new function:', newFunctionName);
      await CompanyFunctionsService.assignFunctionToEmployee({
        company_id: companyId,
        user_id: userId,
        function_id: newFunctionId,
        is_primary: false,
        assigned_by: currentUserId,
        is_active: true,
      });
      
      console.log('Successfully assigned function:', newFunctionName);
      
      // Refresh the data
      await loadFunctions();
      
    } catch (error) {
      console.error('Error changing function:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        alert(`Failed to change function: ${error.message}`);
      } else {
        alert('Failed to change function. Please try again.');
      }
      
      // Reset the dropdown to the current value
      // This will be handled by the key prop forcing a re-render
    } finally {
      setIsAssigning(false);
      currentOperationRef.current = null;
    }
  };

  const handleFunctionClear = async (userId: string, currentFunctionName: string) => {
    // Prevent overlapping operations
    if (currentOperationRef.current) {
      console.log('Operation already in progress, ignoring request');
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${currentFunctionName} from this team member?`)) {
      return;
    }

    const operationId = `clear-${userId}-${Date.now()}`;
    currentOperationRef.current = operationId;

    try {
      setIsAssigning(true);
      const memberFunctions = getMemberFunctions(userId);
      
      if (memberFunctions.length === 0) {
        console.log('No functions to clear');
        return;
      }
      
      for (const func of memberFunctions) {
        await CompanyFunctionsService.removeFunctionFromEmployee(func.id);
      }
      
      // Refresh the data
      await loadFunctions();
    } catch (error) {
      console.error('Error clearing function:', error);
      alert('Failed to clear function. Please try again.');
    } finally {
      setIsAssigning(false);
      currentOperationRef.current = null;
    }
  };

  const getMemberFunctions = (userId: string) => {
    return employeeFunctions.filter(ef => ef.user_id === userId);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getDisplayName = (email: string, firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    return email.split('@')[0];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>Loading team members...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>Error loading team members</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>No team members found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your company doesn&apos;t have any team members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Directory</CardTitle>
        <CardDescription>
          {members.length} team member{members.length !== 1 ? 's' : ''} • Manage roles and function assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium">Member</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-left py-3 px-4 font-medium">Functions</th>
                <th className="text-left py-3 px-4 font-medium">Joined</th>
                {!viewOnly && (
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberFunctions = getMemberFunctions(member.user_id);
                
                return (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={member.user_profile.avatar_url} 
                            alt={getDisplayName(member.user_profile.email, member.user_profile.first_name, member.user_profile.last_name)} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.user_profile.first_name, member.user_profile.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getDisplayName(member.user_profile.email, member.user_profile.first_name, member.user_profile.last_name)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.user_profile.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <Badge 
                        variant="outline" 
                        className={`${getRoleColor(member.role)} border`}
                      >
                        {getRoleLabel(member.role)}
                      </Badge>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="space-y-2">
                        {!viewOnly ? (
                          <select
                            key={`${member.user_id}-${memberFunctions.length > 0 ? memberFunctions[0].function_id : 'none'}`}
                            className="border rounded px-2 py-1 text-sm w-full"
                            onChange={(e) => {
                              if (e.target.value === "") {
                                // Clear function assignment
                                const memberFunctions = getMemberFunctions(member.user_id);
                                if (memberFunctions.length > 0) {
                                  const currentFunctionName = memberFunctions[0].function_name;
                                  handleFunctionClear(member.user_id, currentFunctionName);
                                }
                              } else if (e.target.value) {
                                // Change or assign function
                                const memberFunctions = getMemberFunctions(member.user_id);
                                const currentFunctionName = memberFunctions.length > 0 ? memberFunctions[0].function_name : undefined;
                                handleFunctionChange(member.user_id, e.target.value, currentFunctionName);
                              }
                            }}
                            disabled={isAssigning}
                            value={memberFunctions.length > 0 ? memberFunctions[0].function_id : ""}
                          >
                            <option value="">Select function...</option>
                            {functions.map((func) => (
                              <option key={func.id} value={func.id}>
                                {func.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          // View-only mode: show assigned functions as text
                          memberFunctions.length > 0 ? (
                            memberFunctions.map((func) => (
                              <div key={func.id} className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: func.function_color }}
                                />
                                <span className="text-sm">{func.function_name}</span>
                                {func.is_primary && (
                                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No functions assigned</span>
                          )
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    
                    {!viewOnly && (
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveTeamMember(
                              member.user_id, 
                              getDisplayName(member.user_profile.email, member.user_profile.first_name, member.user_profile.last_name)
                            )}
                            className="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {!viewOnly && functions.length === 0 && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No company functions created yet. Company owners need to create functions first.
            </p>
            <p className="text-xs text-muted-foreground">
              Functions like &quot;Dish Washing&quot;, &quot;Food Preparation&quot;, etc. need to be created before employees can be assigned.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
