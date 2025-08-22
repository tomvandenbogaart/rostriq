'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CompanyService } from '@/lib/company-service'
import { CompanyFunctionsService } from '@/lib/company-functions-service'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Company, UserProfile, CompanyFunctionView } from '@/types/database'
import { RosterDisplay } from '@/components/roster-display'
import { MonthlyScheduleView } from '@/components/monthly-schedule-view'
import { EmptyScheduleView } from '@/components/empty-schedule-view'
import { EmptyDailyScheduleView } from '@/components/empty-daily-schedule-view'
import { WeeklyScheduleView } from '@/components/weekly-schedule-view'
import { Calendar, Clock } from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
}

function RostersContent() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userCompany, setUserCompany] = useState<Company | null>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [companyFunctions, setCompanyFunctions] = useState<CompanyFunctionView[]>([])
  const [functionsLoading, setFunctionsLoading] = useState(false)
  const router = useRouter()

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
        
        // Check if user has companies
        console.log('Checking for user companies...')
        const { companies, error: companiesError } = await CompanyService.getUserCompanies(currentUser.id)
        if (companiesError) {
          console.error('Error fetching user companies:', companiesError)
        }
        console.log('Found companies:', companies)
        
        if (companies && companies.length > 0) {
          setUserCompany(companies[0])
          // Fetch company functions for the company
          await fetchCompanyFunctions(companies[0].id)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error in getUser:', error)
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading rosters...</p>
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
              <p className="text-muted-foreground">
                {viewMode === 'monthly' 
                  ? 'Get a bird\'s eye view of your team\'s working schedules for the entire month'
                  : viewMode === 'weekly'
                  ? 'View your schedule for the entire week'
                  : 'View and manage your team\'s daily schedule'
                }
              </p>
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
              {userCompany && userRole === 'owner' && (
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
                    <MonthlyScheduleView 
                      functions={companyFunctions}
                      currentMonth={new Date()}
                      onMonthChange={() => {}}
                    />
                  </>
                )}
              </div>
            ) : (
              <RosterDisplay companyId={userCompany.id} />
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

          {/* Help Message for Owners Without Company */}
          {!userCompany && userRole === 'owner' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Set Up Your Company
                </CardTitle>
                <CardDescription>
                  Create your company to start using RostrIQ for scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to set up your company profile to start creating schedules and managing your team.
                  </p>
                  <Button onClick={() => router.push('/setup-company')}>
                    Set Up Company
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}

export default function Rosters() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading rosters...</p>
          </div>
        </main>
      </>
    }>
      <RostersContent />
    </Suspense>
  )
}
