import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CompanyProfileForm } from '@/components/company-profile-form';
import { CompanyService } from '@/lib/company-service';
import { CompanyProfileView } from '@/components/company-profile-view';

export default async function CompanyProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/signin');
  }

  // Get user's companies
  const { companies, error: companyError } = await CompanyService.getUserCompanies(user.id);
  
  if (companyError) {
    console.error('Error fetching user companies:', companyError);
  }

  // If user has no companies, redirect to setup
  if (!companies || companies.length === 0) {
    redirect('/setup-company');
  }

  // For now, use the first company (in the future, you might want to add company selection)
  const company = companies[0];

  // Check if user is company owner
  const { isOwner, error: ownershipError } = await CompanyService.isCompanyOwner(company.id, user.id);
  
  if (ownershipError) {
    console.error('Error checking ownership:', ownershipError);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Company Profile
          </h1>
          <p className="text-lg text-gray-600">
            View your company information and profile details
          </p>
        </div>
        
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">
            This page shows your company profile information.
          </p>
          {isOwner && (
            <div className="mb-6">
              <a 
                href="/company-settings"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Company Settings
              </a>
            </div>
          )}
        </div>
        
        <CompanyProfileView company={company} />
      </div>
    </div>
  );
}
