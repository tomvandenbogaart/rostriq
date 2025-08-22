'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { TeamDirectory } from './team-directory';


import type { CompanyMember, Company } from '@/types/database';

interface TeamMemberWithProfile extends CompanyMember {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface TeamPageContentProps {
  members: TeamMemberWithProfile[];
  isLoading?: boolean;
  error?: string | null;
  companyId: string;
  currentUserId: string;
  viewOnly?: boolean;
  onTeamMembersChange?: () => void;
  company: Company;
}

export function TeamPageContent({ 
  members, 
  isLoading, 
  error, 
  companyId, 
  currentUserId, 
  viewOnly = false, 
  onTeamMembersChange,
  company
}: TeamPageContentProps) {
  const handleManageEmployees = () => {
    // Navigate to company settings where employee management is located
    window.location.href = '/company-settings';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members, roles, and working schedules
          </p>
        </div>
        {!viewOnly && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleManageEmployees}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Employees
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8">
        <div className="text-center p-6 bg-card rounded-lg border shadow-sm">
          <div className="text-4xl font-bold mb-2">{members?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total Members</div>
        </div>
        
        <div className="text-center p-6 bg-card rounded-lg border shadow-sm">
          <div className="text-4xl font-bold mb-2">
            {members?.filter(m => !m.is_part_time).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Full-time</div>
        </div>
        
        <div className="text-center p-6 bg-card rounded-lg border shadow-sm">
          <div className="text-4xl font-bold mb-2">
            {members?.filter(m => m.is_part_time).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Part-time</div>
        </div>


      </div>

      {/* Team Directory */}
      <div>
        <TeamDirectory
          members={members}
          isLoading={isLoading}
          error={error}
          companyId={companyId}
          currentUserId={currentUserId}
          viewOnly={viewOnly}
          onTeamMembersChange={onTeamMembersChange}
        />
      </div>


    </div>
  );
}
