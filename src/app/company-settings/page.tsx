'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DatabaseService } from '@/lib/database'
import { CompanyService } from '@/lib/company-service'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompanyJoinRequests } from '@/components/company-join-requests'
import { Company } from '@/types/database'

interface User {
  id: string
  email: string
  created_at: string
}

function CompanySettingsContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userCompany, setUserCompany] = useState<Company | null>(null)
  const router = useRouter()

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

        // Get role from database
        const userRole = await DatabaseService.getUserRole(currentUser.id)
        if (userRole) {
          setUserRole(userRole)
        } else {
          router.push('/role-selection')
          return
        }

        // Only company owners should access this page
        if (userRole !== 'owner') {
          router.push('/dashboard')
          return
        }

        // Fetch user's companies
        const { companies } = await CompanyService.getUserCompanies(currentUser.id)
        if (companies && companies.length > 0) {
          setUserCompany(companies[0])
        } else {
          router.push('/setup-company')
          return
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/signin')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

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
            <p className="text-muted-foreground">Loading company settings...</p>
          </div>
        </main>
      </>
    )
  }

  if (!user || !userCompany) {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Company Settings
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your company profile, team members, and settings
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                ← Back to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/company-profile')}
              >
                View Company Profile
              </Button>
            </div>
          </div>

          {/* Company Profile Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Profile Card - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Company Profile</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/company-profile')}
                    >
                      Edit Profile
                    </Button>
                  </CardTitle>
                  <CardDescription>Your company information and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Company Logo - Left Side */}
                    {userCompany.logo_url && (
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          <img 
                            src={userCompany.logo_url} 
                            alt={`${userCompany.name} logo`}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Company Information - Right Side */}
                    <div className="flex-1 space-y-4">
                      {/* Primary Info Row */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">Company Name</h4>
                          <p className="text-muted-foreground text-lg font-semibold">{userCompany.name}</p>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">Industry</h4>
                          <p className="text-muted-foreground">{userCompany.industry || 'Not specified'}</p>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">Size</h4>
                          <p className="text-muted-foreground">{userCompany.size || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      {/* Description */}
                      {userCompany.description && (
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Description</h4>
                          <p className="text-muted-foreground">{userCompany.description}</p>
                        </div>
                      )}
                      
                      {/* Contact & Website Row */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {userCompany.website && (
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">Website</h4>
                            <a 
                              href={userCompany.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 underline text-sm"
                            >
                              {userCompany.website}
                            </a>
                          </div>
                        )}
                        {userCompany.email && (
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">Contact Email</h4>
                            <a 
                              href={`mailto:${userCompany.email}`}
                              className="text-primary hover:text-primary/80 underline text-sm"
                            >
                              {userCompany.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Join Requests Card - Takes 1 column */}
            <div className="lg:col-span-1">
              <CompanyJoinRequests companyId={userCompany.id} />
            </div>
          </div>

          {/* Company Management Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Manage your team members and roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  Invite Team Members
                </Button>
                <Button className="w-full" variant="outline">
                  Manage Team Roles
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push('/team')}
                >
                  View Team Directory
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>Configure company preferences and policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  Work Schedule Policies
                </Button>
                <Button className="w-full" variant="outline">
                  Leave Policies
                </Button>
                <Button className="w-full" variant="outline">
                  Notification Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account & Billing</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  Subscription Plan
                </Button>
                <Button className="w-full" variant="outline">
                  Billing History
                </Button>
                <Button className="w-full" variant="outline">
                  Payment Methods
                </Button>
              </CardContent>
            </Card>
          </div>


        </div>
      </main>
    </>
  )
}

export default function CompanySettings() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading company settings...</p>
          </div>
        </main>
      </>
    }>
      <CompanySettingsContent />
    </Suspense>
  )
}
