'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { supabase } from '@/lib/supabase'
import { CompanyService } from '@/lib/company-service'
import { ChevronDown, Settings, User, Building2, LogOut } from 'lucide-react'

interface User {
  id: string
  email: string
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [canAccessTeam, setCanAccessTeam] = useState(false)
  const [canAccessCompanySettings, setCanAccessCompanySettings] = useState(false)
  const [hasCompany, setHasCompany] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
          })
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          })
        } else {
          setUser(null)
          setCanAccessTeam(false)
          setCanAccessCompanySettings(false)
          setHasCompany(false)
          setUserRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user permissions when user is authenticated
  useEffect(() => {
    const fetchUserPermissions = async () => {
              if (!user) {
          setCanAccessTeam(false)
          setCanAccessCompanySettings(false)
          setHasCompany(false)
          setUserRole(null)
          return
        }

      try {
        // Get user profile to check role first
        const { data: userProfileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setUserRole(null);
        } else {
          setUserRole(userProfileData.role);
        }

        // Get user's companies
        const { companies, error } = await CompanyService.getUserCompanies(user.id)
        if (error || !companies || companies.length === 0) {
          setCanAccessTeam(false)
          setCanAccessCompanySettings(false)
          setHasCompany(false)
          return
        }

        // User has a company
        setHasCompany(true)

        // Get count for the first company (assuming user is in one company)
        const company = companies[0]
        
        // Check if user can access team management (is owner or admin)
        const { data: currentUserMember } = await supabase
          .from('company_members')
          .select('role')
          .eq('company_id', company.id)
          .eq('user_id', userProfileData.id)
          .eq('is_active', true)
          .single();
        
        if (currentUserMember && ['owner', 'admin'].includes(currentUserMember.role)) {
          setCanAccessTeam(true)
        } else {
          setCanAccessTeam(false)
        }

        // Check if user can access company settings (must be owner)
        const { isOwner } = await CompanyService.isCompanyOwner(company.id, user.id)
        setCanAccessCompanySettings(isOwner)
      } catch (error) {
        console.error('Error fetching user permissions:', error)
        setCanAccessTeam(false)
        setCanAccessCompanySettings(false)
        setHasCompany(false)
        setUserRole(null)
      }
    }

    fetchUserPermissions()
  }, [user])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setIsUserDropdownOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserDropdownOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 h-16 items-center">
          {/* Logo - Left Section */}
          <div className="flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                RostrIQ
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Center Section */}
          <nav className="hidden md:flex items-center justify-center">
            {!user && (
              <div className="flex items-center space-x-8">
                <a 
                  href="#features" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
                <a 
                  href="#contact" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </div>
            )}
            {user && (
              <div className="flex items-center space-x-8">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                {/* Show Rosters for everyone - it will show empty schedules if no company */}
                <Link 
                  href="/rosters" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Rosters
                </Link>
                {/* Only show company-related navigation if user has a company or is an owner */}
                {(hasCompany || userRole === 'owner') && (
                  <>
                    {canAccessTeam && (
                      <Link 
                        href="/team" 
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative"
                      >
                        Team

                      </Link>
                    )}
                    <Link 
                      href="/reports" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Reports
                    </Link>
                    <Link 
                      href="/demo-functions" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Demos
                    </Link>
                  </>
                )}

              </div>
            )}
          </nav>

          {/* Desktop Auth Buttons - Right Section */}
          <div className="hidden md:flex items-center justify-end">
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {!loading && (
                <>
                  {!user ? (
                    <>
                      <Link href="/signin">
                        <Button variant="ghost" size="sm">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button size="sm">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="relative user-dropdown">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      
                      {isUserDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg py-1 z-50">
                          <Link
                            href="/account-settings"
                            className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            onClick={() => setIsUserDropdownOpen(false)}
                          >
                            <User className="h-4 w-4 mr-3" />
                            Account Settings
                          </Link>
                          {canAccessCompanySettings && (
                            <Link
                              href="/company-settings"
                              className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              onClick={() => setIsUserDropdownOpen(false)}
                            >
                              <Building2 className="h-4 w-4 mr-3" />
                              Company Settings
                            </Link>
                          )}
                          <div className="border-t my-1" />
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button - Right Section */}
          <div className="md:hidden flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t">
              {!user ? (
                <>
                  <a
                    href="#features"
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    About
                  </a>
                  <a
                    href="#contact"
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact
                  </a>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/rosters"
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Rosters
                  </Link>
                  {/* Only show company-related navigation if user has a company or is an owner */}
                  {(hasCompany || userRole === 'owner') && (
                    <>
                      <Link
                        href="/reports"
                        className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Reports
                      </Link>
                      <Link
                        href="/demo-functions"
                        className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Demos
                      </Link>
                      {canAccessTeam && (
                        <Link
                          href="/team"
                          className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors relative"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-center justify-between">
                            <span>Team</span>

                          </div>
                        </Link>
                      )}
                    </>
                  )}

                  <div className="border-t my-1" />
                  <Link
                    href="/account-settings"
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-3" />
                      Account Settings
                    </div>
                  </Link>
                  {canAccessCompanySettings && (
                    <Link
                      href="/company-settings"
                      className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-3" />
                        Company Settings
                      </div>
                    </Link>
                  )}
                </>
              )}
              <div className="pt-4 pb-3 border-t">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                {!loading && (
                  <div className="flex flex-col space-y-2">
                    {!user ? (
                      <>
                        <Link href="/signin" className="w-full">
                          <Button variant="ghost" size="sm" className="justify-start w-full">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/signup" className="w-full">
                          <Button size="sm" className="justify-start w-full">
                            Get Started
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Signed in as: {user.email}
                        </div>
                        <Button 
                          onClick={handleSignOut} 
                          variant="ghost" 
                          size="sm" 
                          className="justify-start w-full"
                        >
                          Sign Out
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
