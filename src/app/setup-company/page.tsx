'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CompanyProfileForm } from '@/components/company-profile-form';
import { CompanyService } from '@/lib/company-service';
import { MinimalHeader } from '@/components/minimal-header';

export default function SetupCompanyPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      try {
        // Check if user is authenticated
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          router.push('/signin');
          return;
        }

        // Check if user already has a company
        const { companies, error: companyError } = await CompanyService.getUserCompanies(currentUser.id);
        
        if (companyError) {
          console.error('Error fetching user companies:', companyError);
          // Don't return here, continue with setup if there's an error fetching companies
        } else if (companies && companies.length > 0) {
          // If user already has a company, redirect to dashboard
          console.log('User already has companies, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Get user profile to check role
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Unable to fetch user profile');
          return;
        }

        // Only allow owners to create companies
        if (userProfile?.role !== 'owner') {
          console.log('User is not an owner, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        setUser({ id: currentUser.id, email: currentUser.email || '' });
      } catch (error) {
        console.error('Error in setup company page:', error);
        setError('An error occurred while loading the page');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndSetup();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <MinimalHeader />
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                RostrIQ
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Let&apos;s get your company profile configured so you can start using the platform.
            </p>
          </div>

          {/* Company Setup Form */}
          <div className="col-span-full">
            <CompanyProfileForm 
              userId={user.id}
              mode="create"
            />
          </div>
        </div>
      </main>
    </>
  );
}
