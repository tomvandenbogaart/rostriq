'use client';

import { Company, CompanyMember } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { TeamDirectory } from './team-directory';
import { useEffect, useState } from 'react';
import { CompanyService } from '@/lib/company-service';

interface TeamMemberWithProfile extends CompanyMember {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

interface CompanyProfileViewProps {
  company: Company;
}

export function CompanyProfileView({ company }: CompanyProfileViewProps) {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch team members
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

    fetchData();
  }, [company.id]);

  const formatField = (value: string | undefined) => {
    return value || 'Not specified';
  };

  const formatAddress = () => {
    const parts = [
      company.address,
      company.city,
      company.state,
      company.postal_code,
      company.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            {company.logo_url && (
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <div>
              <CardTitle className="text-2xl">{company.name}</CardTitle>
              <CardDescription>
                {company.industry && `${company.industry} • `}
                {company.size && `${company.size}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {company.description && (
            <p className="text-gray-700 mb-4">{company.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.website && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Website</h4>
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            
            {company.email && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                <a 
                  href={`mailto:${company.email}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {company.email}
                </a>
              </div>
            )}
            
            {company.phone && (
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
                <a 
                  href={`tel:${company.phone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {company.phone}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Additional information about your company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Industry</h4>
              <p className="text-gray-700">{formatField(company.industry)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Company Size</h4>
              <p className="text-gray-700">{formatField(company.size)}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Address</h4>
              <p className="text-gray-700">{formatAddress()}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Founded</h4>
              <p className="text-gray-700">
                {company.created_at 
                  ? new Date(company.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not specified'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Directory */}
      <TeamDirectory 
        members={teamMembers}
        isLoading={isLoadingTeam}
        error={teamError}
        companyId={company.id}
        currentUserId=""
        viewOnly={true}
        onTeamMembersChange={() => {}}
      />

      {/* Actions */}
      <div className="flex justify-center">
        <Button 
          onClick={() => router.push('/dashboard')}
          variant="outline"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
