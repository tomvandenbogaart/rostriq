'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { CompanyService } from '@/lib/company-service'
import { CompanyFunctionsService } from '@/lib/company-functions-service'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Company, UserProfile, CompanyFunctionView, EmployeeFunctionView, CompanyMember } from '@/types/database'
import { RosterDisplay } from '@/components/roster-display'
import { MonthlyScheduleView } from '@/components/monthly-schedule-view'
import { EmptyScheduleView } from '@/components/empty-schedule-view'
import { EmptyDailyScheduleView } from '@/components/empty-daily-schedule-view'
import { WeeklyScheduleView } from '@/components/weekly-schedule-view'
import { CompanyWeeklyScheduleView } from '@/components/company-weekly-schedule-view'
import { CompanyDailyScheduleView } from '@/components/company-daily-schedule-view'
import { CompanyMonthlyScheduleView } from '@/components/company-monthly-schedule-view'
import { X } from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
}

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userCompany, setUserCompany] = useState<Company | null>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [companyFunctions, setCompanyFunctions] = useState<CompanyFunctionView[]>([])
  const [functionsLoading, setFunctionsLoading] = useState(false)
  const [employees, setEmployees] = useState<EmployeeFunctionView[]>([])
  const [teamMembers, setTeamMembers] = useState<(CompanyMember & { user_profile: { email: string; first_name?: string; last_name?: string; avatar_url?: string } })[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlRole = searchParams.get('role')
  const urlCompany = searchParams.get('company')

  // Fetch company functions for the company
  const fetchCompanyFunctions = async (companyId: string) => {
    if (!companyId) return
    
    setFunctionsLoading(true)
    try {
      const functions = await CompanyFunctionsService.getCompanyFunctions(companyId)
      console.log('Fetched company functions:', functions)
      setCompanyFunctions(functions)
    } catch (error) {
      console.error('Error fetching company functions:', error)
    } finally {
      setFunctionsLoading(false)
    }
  }

  // Fetch employees and team members for the company
  const fetchCompanyData = async (companyId: string) => {
    if (!companyId) return
    
    try {
      const [employeesData, teamMembersData] = await Promise.all([
        CompanyFunctionsService.getAllEmployeesWithFunctions(companyId),
        CompanyService.getCompanyTeamMembers(companyId),
      ])
      
      setEmployees(employeesData)
      setTeamMembers(teamMembersData.members || [])
    } catch (error) {
      console.error('Error fetching company data:', error)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error || !currentUser) {
          router.push('/signin')
          return
        }

        setUser({
          id: currentUser.id,
          email: currentUser.email || '',
          created_at: currentUser.created_at,
        })

        // If user just joined a company, wait a bit for the database to sync
        const justJoined = searchParams.get('joined') === 'true'
        if (justJoined) {
          // Wait 1 second for database to sync
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Check if user has companies first (this bypasses RLS issues)
        console.log('Checking for user companies...')
        const { companies, error: companiesError } = await CompanyService.getUserCompanies(currentUser.id)
        if (companiesError) {
          console.error('Error fetching user companies:', companiesError)
        }
        console.log('Found companies:', companies)
        
        // Get user profile to check role first
        const { data: userProfileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          router.push('/signin');
          return;
        }

        console.log('User profile data:', userProfileData);
        setUserProfile(userProfileData);
        setUserRole(userProfileData.role);
        
        if (companies && companies.length > 0) {
          setUserCompany(companies[0])
          // Fetch company functions and data for the company
          await Promise.all([
            fetchCompanyFunctions(companies[0].id),
            fetchCompanyData(companies[0].id)
          ])
        } else if (userProfileData.role === 'owner') {
          // Owner without companies should go to setup
          console.log('User is owner but has no companies, redirecting to setup-company');
          router.push('/setup-company')
          return
        } else {
          // Regular user without companies can stay on dashboard
          // They might be waiting for an invitation or have a different flow
          console.log('User is not an owner and has no companies, staying on dashboard')
        }

        // Handle URL company parameter if provided
        if (urlCompany) {
          const { company } = await CompanyService.getCompanyById(urlCompany)
          if (company) {
            setUserCompany(company)
            // Fetch company functions and data for the URL company
            await Promise.all([
              fetchCompanyFunctions(company.id),
              fetchCompanyData(company.id)
            ])
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error in getUser:', error)
        setLoading(false)
      }
    }

    getUser()
  }, [router, searchParams, urlCompany])



  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">


          {/* Schedule Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {viewMode === 'monthly' ? 'Monthly Schedule' : 
                 viewMode === 'weekly' ? 'Weekly Schedule' : 'Daily Schedule'}
              </h1>
              {(userRole === 'owner' || userRole === 'admin') && (
                <p className="text-muted-foreground">
                  {viewMode === 'monthly' 
                    ? 'Get a bird\'s eye view of your team\'s working schedules for the entire month'
                    : viewMode === 'weekly'
                    ? 'View your schedule for the entire week'
                    : 'View and manage your team\'s daily schedule'
                  }
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex gap-2">
                <Button 
                  variant={viewMode === 'daily' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode('daily')}
                >
                  Daily
                </Button>
                <Button 
                  variant={viewMode === 'weekly' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode('weekly')}
                >
                  Weekly
                </Button>
                <Button 
                  variant={viewMode === 'monthly' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode('monthly')}
                >
                  Monthly
                </Button>
              </div>
              {userRole === 'owner' && (
                <Button>
                  Create New Roster
                </Button>
              )}
            </div>
          </div>

          {/* Schedule Content */}
          {userCompany ? (
            viewMode === 'monthly' ? (
              <div className="space-y-4">
                {/* Loading state for functions */}
                {functionsLoading && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading company functions...</p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Error state for functions */}
                {!functionsLoading && companyFunctions.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <div className="text-muted-foreground mb-4">
                        No company functions found
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Company functions need to be created to see them in the schedule.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => fetchCompanyFunctions(userCompany.id)}
                      >
                        Refresh Functions
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {/* Company functions view */}
                {!functionsLoading && companyFunctions.length > 0 && (
                  <>
                    {(userRole === 'owner' || userRole === 'admin') && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Showing {companyFunctions.length} company function{companyFunctions.length !== 1 ? 's' : ''}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchCompanyFunctions(userCompany.id)}
                        >
                          Refresh
                        </Button>
                      </div>
                    )}
                    <CompanyMonthlyScheduleView 
                      currentMonth={new Date()}
                      onMonthChange={() => {}}
                      companyFunctions={companyFunctions}
                      employees={employees}
                      teamMembers={teamMembers}
                      userRole={userRole as 'owner' | 'admin' | 'member'}
                    />
                  </>
                )}
              </div>
            ) : viewMode === 'weekly' ? (
              <CompanyWeeklyScheduleView 
                currentWeek={new Date()}
                onWeekChange={() => {}}
                companyFunctions={companyFunctions}
                employees={employees}
                teamMembers={teamMembers}
                userRole={userRole as 'owner' | 'admin' | 'member'}
              />
            ) : (
              <CompanyDailyScheduleView 
                currentDate={new Date()}
                onDateChange={() => {}}
                companyFunctions={companyFunctions}
                employees={employees}
                teamMembers={teamMembers}
                userRole={userRole as 'owner' | 'admin' | 'member'}
              />
            )
          ) : (
            // Show empty schedule views instead of just a message
            viewMode === 'monthly' ? (
              <EmptyScheduleView 
                currentMonth={new Date()}
                onMonthChange={() => {}}
              />
            ) : viewMode === 'weekly' ? (
              <WeeklyScheduleView 
                currentWeek={new Date()}
                onWeekChange={() => {}}
              />
            ) : (
              <EmptyDailyScheduleView 
                selectedDate={new Date()}
                onDateChange={() => {}}
              />
            )
          )}

          {/* Help Message for Users Without Company */}
          {!userCompany && userRole === 'owner' && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  Company profile not set up yet
                </div>
                <Button onClick={() => router.push('/setup-company')}>
                  Set Up Company
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Debug Information */}
          {process.env.NODE_ENV === 'development' && (
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>Current user state for debugging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>User ID:</strong> {user?.id}</div>
                  <div><strong>Email:</strong> {user?.email}</div>
                  <div><strong>Role:</strong> {userRole}</div>
                  <div><strong>Has Company:</strong> {userCompany ? 'Yes' : 'No'}</div>
                  {userCompany && (
                    <div><strong>Company Name:</strong> {userCompany.name}</div>
                  )}
                  <div><strong>Profile ID:</strong> {userProfile?.id}</div>
                </div>
              </CardContent>
            </Card>
          )}




          {/* Getting Started Card */}
          {!localStorage.getItem('gettingStartedDismissed') && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>
                      {userRole === 'owner' 
                        ? 'Complete these steps to set up your company' 
                        : 'Complete these steps to get started'
                      }
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.setItem('gettingStartedDismissed', 'true')
                      window.location.reload()
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                      ✓
                    </div>
                    <span>Create your account</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                      ✓
                    </div>
                    <span>Select your role</span>
                  </div>
                  {userRole === 'owner' ? (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          userCompany ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {userCompany ? '✓' : '3'}
                        </div>
                        <span>Set up company profile</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          4
                        </div>
                        <span>Invite team members</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          5
                        </div>
                        <span>Create company functions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          6
                        </div>
                        <span>Assign employees to functions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          7
                        </div>
                        <span>Set up working schedules</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          8
                        </div>
                        <span>Create your first roster</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <span>Wait for company invitation</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          4
                        </div>
                        <span>Accept invitation to join company</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          5
                        </div>
                        <span>View your schedule and working hours</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </>
    }>
      <DashboardContent />
    </Suspense>
  )
}
