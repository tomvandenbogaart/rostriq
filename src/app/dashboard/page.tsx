'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DatabaseService } from '@/lib/database'
import { CompanyService } from '@/lib/company-service'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Company } from '@/types/database'

interface User {
  id: string
  email: string
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
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

  if (!user) {
    return null
  }

  return (
    <>
      <Header />
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
              Hello, <span className="font-semibold text-foreground">{user.email}</span>! 
              Welcome to your {userRole === 'owner' ? 'company management' : 'user'} dashboard.
              {userCompany && (
                <span className="block mt-2 text-lg">
                  Company: <span className="font-semibold text-foreground">{userCompany.name}</span>
                </span>
              )}
            </p>
          </div>

          {/* Company Profile Card for Owners */}
          {userRole === 'owner' && userCompany && (
            <div className="col-span-full">
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
                  <CardDescription>Your company information</CardDescription>
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
          )}

          {/* Dashboard Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRole === 'owner' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Company Management</CardTitle>
                  <CardDescription>Manage your company and team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userCompany ? (
                    <>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => router.push('/company-profile')}
                      >
                        Manage Company Profile
                      </Button>
                      <Button className="w-full" variant="outline">
                        Invite Team Members
                      </Button>
                      <Button className="w-full" variant="outline">
                        Company Settings
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => router.push('/setup-company')}
                    >
                      Set Up Company Profile
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Get started with common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline">
                    View My Schedule
                  </Button>
                  <Button className="w-full" variant="outline">
                    Team Calendar
                  </Button>
                  <Button className="w-full" variant="outline">
                    Request Time Off
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Account created successfully</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Welcome email sent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Profile setup pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Role:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      userRole === 'owner' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {userRole === 'owner' ? 'Company Owner' : 'Team Member'}
                    </span>
                  </p>
                  <p><span className="font-medium">Member since:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <Button 
                  onClick={handleSignOut} 
                  variant="destructive" 
                  className="w-full"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started Section */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                {userRole === 'owner' 
                  ? 'Complete these steps to set up your company' 
                  : 'Complete these steps to get started'
                }
              </CardDescription>
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
        </div>
      </main>
    </>
  )
}
