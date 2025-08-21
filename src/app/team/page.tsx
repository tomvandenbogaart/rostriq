'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CompanyService } from '@/lib/company-service';
import { DatabaseService } from '@/lib/database';
import { TeamPageContent } from '@/components/team-page-content';
import { Header } from '@/components/header';
import { Company, UserProfile, CompanyMember } from '@/types/database';

interface User {
  id: string;
  email: string;
}

interface TeamMemberWithProfile extends CompanyMember {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

function TeamPageMain() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTeamMembers = async () => {
    if (!userCompany) return;
    
    setIsLoadingTeam(true);
    setTeamError(null);
    
    try {
      const { members, error } = await CompanyService.getCompanyTeamMembers(userCompany.id);
      
      if (error) {
        setTeamError(error);
      } else {
        setTeamMembers(members || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamError('Failed to load team members');
    } finally {
      setIsLoadingTeam(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error || !currentUser) {
          router.push('/signin');
          return;
        }

        setUser({
          id: currentUser.id,
          email: currentUser.email || '',
        });

        // Create user profile from auth data instead of querying database
        const userProfileData = {
          id: currentUser.id,
          user_id: currentUser.id,
          email: currentUser.email || '',
          role: 'owner' as const, // Since they're accessing team page, they're likely an owner
          first_name: currentUser.user_metadata?.first_name || '',
          last_name: currentUser.user_metadata?.last_name || '',
          company_name: '',
          phone: '',
          avatar_url: '',
          is_active: true,
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at || currentUser.created_at
        }
        setUserProfile(userProfileData);

        // Fetch user's companies
        const { companies, error: companyError } = await CompanyService.getUserCompanies(currentUser.id);
        
        if (companyError) {
          console.error('Error fetching user companies:', companyError);
        }

        // If user has no companies, redirect to setup
        if (!companies || companies.length === 0) {
          router.push('/setup-company');
          return;
        }

        // Use the first company
        setUserCompany(companies[0]);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  // Fetch team members when company is set
  useEffect(() => {
    if (userCompany) {
      fetchTeamMembers();
    }
  }, [userCompany]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading team management...</p>
          </div>
        </main>
      </>
    );
  }

  if (!user || !userProfile || !userCompany) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <TeamPageContent 
            members={teamMembers}
            isLoading={isLoadingTeam}
            error={teamError}
            companyId={userCompany.id}
            currentUserId={userProfile.id}
            onTeamMembersChange={fetchTeamMembers}
          />
        </div>
      </main>
    </>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading team management...</p>
          </div>
        </main>
      </>
    }>
      <TeamPageMain />
    </Suspense>
  );
}
