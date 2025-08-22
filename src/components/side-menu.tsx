'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { supabase } from '@/lib/supabase'
import { CompanyService } from '@/lib/company-service'
import { UserProfileService } from '@/lib/user-profile-service'
import { 
  ChevronDown, 
  Settings, 
  User, 
  Building2, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  PlayCircle,
  Home
} from 'lucide-react'

interface User {
  id: string
  email: string
}

export function SideMenu() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [canAccessTeam, setCanAccessTeam] = useState(false)
  const [canAccessCompanySettings, setCanAccessCompanySettings] = useState(false)
  const [hasCompany, setHasCompany] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

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
        // Get user profile to check role first using the centralized service
        const { userProfile: userProfileData, error: profileError } = await UserProfileService.getUserProfile(user.id);

        if (profileError || !userProfileData) {
          console.error('Error fetching user profile:', profileError);
          setUserRole(null);
          // Don't proceed with other operations if we can't get the user profile
          return;
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  if (!user) {
    return null
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-3 bg-background border rounded-lg shadow-lg hover:bg-accent transition-all duration-200 md:hidden"
        aria-label="Toggle side menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Side Menu */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-background border-r shadow-xl z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                RostrIQ
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/rosters"
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/rosters') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Rosters</span>
            </Link>

            {/* Company-related navigation */}
            {(hasCompany || userRole === 'owner') && (
              <>
                {canAccessTeam && (
                  <Link
                    href="/team"
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isActive('/team') 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5" />
                      <span>Team</span>
                    </div>
                  </Link>
                )}

                <Link
                  href="/reports"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/reports') 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Reports</span>
                </Link>

                <Link
                  href="/demo-functions"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/demo-functions') 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>Demos</span>
                </Link>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>

            {/* User Section */}
            <div className="space-y-2">
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Signed in as: {user.email}
              </div>
              
              <Link
                href="/account-settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="text-sm">Account Settings</span>
              </Link>

              {canAccessCompanySettings && (
                <Link
                  href="/company-settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">Company Settings</span>
                </Link>
              )}

              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="sm" 
                className="justify-start w-full text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
