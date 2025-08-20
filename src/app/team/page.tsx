'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CompanyService } from '@/lib/company-service';
import { DatabaseService } from '@/lib/database';
import { TeamPageContent } from '@/components/team-page-content';
import { Header } from '@/components/header';
import { Company, UserProfile } from '@/types/database';

interface User {
  id: string;
  email: string;
}

function TeamPageMain() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const router = useRouter();

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

        // Get user profile from database
        const userProfileData = await DatabaseService.getUserProfile(currentUser.id);
        if (userProfileData) {
          setUserProfile(userProfileData);
        } else {
          router.push('/role-selection');
          return;
        }

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
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            <p className="text-muted-foreground">Manage your team members and join requests</p>
          </div>
          
          <TeamPageContent company={userCompany} currentUserId={userProfile.id} />
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
