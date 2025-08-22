'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { CompanyService } from '@/lib/company-service'
import { SideMenu } from '@/components/side-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Company, UserProfile } from '@/types/database'
import { CompanyFunctionsManager } from '@/components/company-functions-manager'
import { EmployeeManagement } from '@/components/employee-management'

interface User {
  id: string
  email: string
  created_at: string
}

function CompanySettingsContent() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
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

        // Fetch the actual user profile from database
        const { data: userProfileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (profileError || !userProfileData) {
          console.error('Error fetching user profile:', profileError)
          router.push('/signin')
          return
        }

        setUserProfile(userProfileData)

        // Only company owners should access this page
        if (userProfileData.role !== 'owner') {
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

  if (loading) {
    return (
      <>
        <SideMenu />
        <main className="min-h-screen flex items-center justify-center md:ml-80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading company settings...</p>
          </div>
        </main>
      </>
    )
  }

  if (!user || !userProfile || !userCompany) {
    return null
  }

  return (
    <>
      <SideMenu />
      <main className="min-h-screen py-8 md:ml-80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Company Settings</h1>
            <p className="text-muted-foreground">Manage your company profile, team members, and settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Profile - Takes 2/3 width */}
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
                        <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                          <Image 
                            src={userCompany.logo_url} 
                            alt={`${userCompany.name} logo`}
                            width={96}
                            height={96}
                            className="w-full h-full object-contain"
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

            {/* Quick Actions - Takes 1/3 width */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common company management tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/team')}
                  >
                    Manage Team
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/dashboard')}
                  >
                    ← Back to Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/company-profile')}
                  >
                    View Company Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Employee Management */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Employee Management</h2>
              <p className="text-muted-foreground">Add and manage team members by name - no email validation required</p>
            </div>
            
            <EmployeeManagement 
              companyId={userCompany.id} 
              company={userCompany}
              userRole={userProfile.role as 'owner' | 'admin' | 'member'}
            />
          </div>

          {/* Company Functions Management */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Company Functions</h2>
              <p className="text-muted-foreground">Create and manage functions that employees can be assigned to</p>
            </div>
            
            <CompanyFunctionsManager 
              companyId={userCompany.id} 
              currentUserId={userProfile.id} 
            />
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
        <SideMenu />
        <main className="min-h-screen flex items-center justify-center md:ml-80">
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
