'use client';

import { useState, useEffect, useRef } from 'react';
import { CompanyMember } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CompanyFunctionsService } from '@/lib/company-functions-service';
import { CompanyService } from '@/lib/company-service';
import { WorkingScheduleEditor } from '@/components/working-schedule-editor';
import { Pencil, Search, Clock } from 'lucide-react';
import type { CompanyFunctionView, EmployeeFunctionView, CreateCompanyFunctionAssignment, DailySchedule } from '@/types/database';

interface TeamMemberWithProfile extends CompanyMember {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  is_part_time?: boolean;
  working_schedule_notes?: string;
  daily_schedule?: DailySchedule;
  weekly_hours?: number;
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
  const [editingScheduleFor, setEditingScheduleFor] = useState<string | null>(null);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleUpdateWorkingSchedule = async (userId: string, schedule: {
    daily_schedule: DailySchedule;
    is_part_time: boolean;
    working_schedule_notes?: string;
  }) => {
    try {
      setIsUpdatingSchedule(true);
      const result = await CompanyService.updateTeamMemberSchedule(
        companyId, 
        userId, 
        currentUserId, 
        schedule
      );
      
      if (result.success) {
        setEditingScheduleFor(null);
        // Call the callback to refresh team members list
        if (onTeamMembersChange) {
          onTeamMembersChange();
        }
      } else {
        alert(`Failed to update working schedule: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating working schedule:', error);
      alert('Failed to update working schedule. Please try again.');
    } finally {
      setIsUpdatingSchedule(false);
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

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      await CompanyService.cancelInvitation(companyId, invitationId, currentUserId);
      await loadFunctions(); // Refresh functions to reflect invitation cancellation
      if (onTeamMembersChange) {
        onTeamMembersChange();
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
      alert('Failed to cancel invitation. Please try again.');
    }
  };

  const getMemberFunctions = (userId: string) => {
    return employeeFunctions.filter(ef => ef.user_id === userId);
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const firstName = member.user_profile?.first_name?.toLowerCase() || '';
    const lastName = member.user_profile?.last_name?.toLowerCase() || '';
    const email = member.user_profile?.email?.toLowerCase() || '';
    const role = member.role?.toLowerCase() || '';
    
    return firstName.includes(query) || 
           lastName.includes(query) || 
           email.includes(query) || 
           role.includes(query);
  });

  const getRoleColor = (role: string, isPending: boolean = false) => {
    if (isPending) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    
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

  const getDisplayName = (email: string | undefined, firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    return email ? email.split('@')[0] : 'Unknown User';
  };

  const formatWorkingSchedule = (member: TeamMemberWithProfile) => {
    // Check if member has daily_schedule (new format)
    if (member.daily_schedule) {
      const dayLabels: Record<string, string> = {
        monday: 'Mon',
        tuesday: 'Tue', 
        wednesday: 'Wed',
        thursday: 'Thu',
        friday: 'Fri',
        saturday: 'Sat',
        sunday: 'Sun'
      };

      const activeDays = Object.entries(member.daily_schedule)
        .filter(([, schedule]) => schedule?.enabled)
        .map(([day]) => dayLabels[day] || day);

      if (activeDays.length === 0) {
        return <span className="text-sm text-muted-foreground">Not set</span>;
      }

      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{activeDays.join(', ')}</div>
          {member.weekly_hours && (
            <div className="text-xs text-muted-foreground">
              {member.weekly_hours.toFixed(1)}h/week
            </div>
          )}
          {member.is_part_time && (
            <Badge variant="secondary" className="text-xs">Part-time</Badge>
          )}
        </div>
      );
    }

    // Fallback to old format for backward compatibility
    if (!member.working_days || member.working_days.length === 0) {
      return <span className="text-sm text-muted-foreground">Not set</span>;
    }

    const dayLabels: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue', 
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };

    const days = member.working_days.map(day => dayLabels[day] || day);
    const timeRange = member.working_hours_start && member.working_hours_end 
      ? `${member.working_hours_start.substring(0, 5)} - ${member.working_hours_end.substring(0, 5)}`
      : '';

    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{days.join(', ')}</div>
        {timeRange && <div className="text-xs text-muted-foreground">{timeRange}</div>}
        {member.is_part_time && (
          <Badge variant="secondary" className="text-xs">Part-time</Badge>
        )}
      </div>
    );
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
          {members.length} team member{members.length !== 1 ? 's' : ''} • Manage roles, function assignments, and pending invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {members.length} members
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium">Member</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-left py-3 px-4 font-medium">Functions</th>
                <th className="text-left py-3 px-4 font-medium">Working Schedule</th>
                <th className="text-left py-3 px-4 font-medium">Joined</th>
                {!viewOnly && (
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const memberFunctions = member.is_pending_invitation ? [] : getMemberFunctions(member.user_id);
                
                return (
                  <tr key={member.id} className="border-b border-border/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={member.user_profile.avatar_url} 
                            alt={getDisplayName(member.user_profile.email, member.user_profile.first_name, member.user_profile.last_name)} 
                          />
                          <AvatarFallback className={`${
                            member.is_pending_invitation 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {member.is_pending_invitation ? (
                              <Clock className="h-5 w-5" />
                            ) : (
                              getInitials(member.user_profile.first_name, member.user_profile.last_name)
                            )}
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
                        className={`${getRoleColor(member.role, member.is_pending_invitation)} border`}
                      >
                        {member.is_pending_invitation ? (
                          member.invitation_data ? (
                            `Invited ${new Date(member.invitation_data.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}`
                          ) : (
                            'Invited'
                          )
                        ) : (
                          getRoleLabel(member.role)
                        )}
                      </Badge>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="space-y-2">
                        {member.is_pending_invitation ? (
                          <span className="text-sm text-muted-foreground">Pending</span>
                        ) : !viewOnly ? (
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
                      <div className="flex items-center justify-between">
                        <div>
                          {member.is_pending_invitation ? (
                            <span className="text-sm text-muted-foreground">Pending</span>
                          ) : (
                            formatWorkingSchedule(member)
                          )}
                        </div>
                        {!viewOnly && !member.is_pending_invitation && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingScheduleFor(member.user_id)}
                            className="h-8 w-8 p-0 ml-2"
                            title={(member.daily_schedule && Object.values(member.daily_schedule).some(day => day?.enabled)) || 
                                   (member.working_days && member.working_days.length > 0) ? 'Edit Schedule' : 'Set Schedule'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">
                        {member.is_pending_invitation ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                        ) : (
                          new Date(member.joined_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        )}
                      </span>
                    </td>
                    
                    {!viewOnly && (
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {member.is_pending_invitation ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelInvitation(member.invitation_data?.id || '')}
                              className="text-xs"
                              disabled={!member.invitation_data?.id}
                            >
                              Cancel Invitation
                            </Button>
                          ) : (
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
                          )}
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
      
              {/* Working Schedule Editor Modal */}
        {editingScheduleFor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full">
              <WorkingScheduleEditor
                schedule={{
                  daily_schedule: members.find(m => m.user_id === editingScheduleFor)?.daily_schedule || {
                    monday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
                    tuesday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
                    wednesday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
                    thursday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' },
                    friday: { enabled: true, start_time: '09:00:00', end_time: '17:00:00' }
                  },
                  is_part_time: members.find(m => m.user_id === editingScheduleFor)?.is_part_time || false,
                  working_schedule_notes: members.find(m => m.user_id === editingScheduleFor)?.working_schedule_notes || ''
                }}
                onSave={(schedule) => handleUpdateWorkingSchedule(editingScheduleFor, schedule)}
                onCancel={() => setEditingScheduleFor(null)}
                isLoading={isUpdatingSchedule}
              />
            </div>
          </div>
        )}
    </Card>
  );
}
