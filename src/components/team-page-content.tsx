'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus } from 'lucide-react';
import { TeamDirectory } from './team-directory';

import type { CompanyMember } from '@/types/database';

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
}

export function TeamPageContent({ 
  members, 
  isLoading, 
  error, 
  companyId, 
  currentUserId, 
  viewOnly = false, 
  onTeamMembersChange 
}: TeamPageContentProps) {

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
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{members?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold">
                {members?.filter(m => !m.is_part_time).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Full-time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold">
                {members?.filter(m => m.is_part_time).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Part-time</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
