'use client';

import { Company, CompanyMember } from '@/types/database';
import { useEffect, useState } from 'react';
import { CompanyService } from '@/lib/company-service';
import { TeamDirectory } from './team-directory';
import { CompanyJoinRequests } from './company-join-requests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamPageContentProps {
  company: Company;
}

export function TeamPageContent({ company }: TeamPageContentProps) {
  const [teamMembers, setTeamMembers] = useState<(CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsLoadingTeam(true);
      setTeamError(null);
      
      const { members, error } = await CompanyService.getCompanyTeamMembers(company.id);
      
      if (error) {
        setTeamError(error);
      } else {
        setTeamMembers(members || []);
      }
      
      setIsLoadingTeam(false);
    };

    fetchTeamMembers();
  }, [company.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team Directory - Takes 2/3 width */}
      <div className="lg:col-span-2">
        <TeamDirectory 
          members={teamMembers}
          isLoading={isLoadingTeam}
          error={teamError}
        />
      </div>

      {/* Join Requests - Takes 1/3 width */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Join Requests</CardTitle>
            <CardDescription>
              Review and manage pending requests to join your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyJoinRequests companyId={company.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
