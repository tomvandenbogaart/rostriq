import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CompanyService } from '@/lib/company-service';
import { CompanyProfileView } from '@/components/company-profile-view';

export default async function CompanyProfileViewPage() {
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

  // Use the first company (in the future, you might want to add company selection)
  const company = companies[0];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Company Profile
          </h1>
          <p className="text-lg text-gray-600">
            View your company information
          </p>
        </div>
        
        <CompanyProfileView company={company} />
      </div>
    </div>
  );
}
