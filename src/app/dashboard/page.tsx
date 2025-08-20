'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DatabaseService } from '@/lib/database'
import { CompanyService } from '@/lib/company-service'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Company, UserProfile } from '@/types/database'
import { RosterDisplay } from '@/components/roster-display'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlRole = searchParams.get('role')
  const urlCompany = searchParams.get('company')

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

        // Get user profile from database
        const userProfileData = await DatabaseService.getUserProfile(currentUser.id)
        if (userProfileData) {
          setUserProfile(userProfileData)
        } else {
          router.push('/role-selection')
          return
        }

        // Check for role in URL first, then database
        if (urlRole) {
          setUserRole(urlRole)
        } else {
          // Get role from database
          const userRole = await DatabaseService.getUserRole(currentUser.id)
          if (userRole) {
            setUserRole(userRole)
          } else {
            // If no role is set, redirect to role selection
            router.push('/role-selection')
            return
          }
        }

        // Check for company in URL or fetch user's companies
        if (urlCompany) {
          const { company } = await CompanyService.getCompanyById(urlCompany)
          if (company) {
            setUserCompany(company)
          }
        } else {
          // Fetch user's companies
          const { companies } = await CompanyService.getUserCompanies(currentUser.id)
          if (companies && companies.length > 0) {
            setUserCompany(companies[0])
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/signin')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router, urlRole])

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


          {/* Today's Schedule Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Today&apos;s Schedule</h1>
              <p className="text-muted-foreground">View and manage your team&apos;s daily schedule</p>
            </div>
            <div className="flex gap-3">
              <Button>
                Create New Roster
              </Button>
            </div>
          </div>

          {/* Direct Roster Display */}
          {userCompany ? (
            <RosterDisplay companyId={userCompany.id} />
          ) : (
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
                        <span>Create your first roster</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          3
                        </div>
                        <span>Complete your profile</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                          4
                        </div>
                        <span>View your schedule</span>
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
