'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { DatabaseService } from '@/lib/database'
import { CompanyService } from '@/lib/company-service'
import { CompanySearch } from '@/components/company-search'
import { toast } from 'sonner'
import { User, Building2 } from 'lucide-react'
import { Company } from '@/types/database'

export function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<'user' | 'owner' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCompanySearch, setShowCompanySearch] = useState(false)
  const router = useRouter()

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error("Please select a role")
      return
    }

    if (selectedRole === 'user') {
      // Show company search for users
      setShowCompanySearch(true)
      return
    }

    // Handle owner role selection
    await handleOwnerRoleSelection()
  }

  const handleOwnerRoleSelection = async () => {
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        router.push('/signin')
        return
      }

      // Get the user profile - it should exist from the database trigger
      const userProfile = await DatabaseService.getUserProfile(user.id)
      
      if (!userProfile) {
        console.error('User profile not found - this should not happen with the database trigger')
        toast.error("User profile not found. Please try signing up again.")
        return
      }
      
      console.log('User profile found:', userProfile)

      // Update the user's role in the database
      const updatedProfile = await DatabaseService.updateUserRole(user.id, selectedRole!)
      
      if (!updatedProfile) {
        toast.error("Failed to update user role")
        return
      }
      
      // Redirect to company setup for owners
      router.push('/setup-company')
      toast.success(`Welcome! You've selected the ${selectedRole} role.`)
    } catch (error) {
      console.error('Error in handleOwnerRoleSelection:', error)
      toast.error("An error occurred while setting your role")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanySelected = async (company: Company) => {
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        router.push('/signin')
        return
      }

      // Get the user profile
      const userProfile = await DatabaseService.getUserProfile(user.id)
      
      if (!userProfile) {
        toast.error("User profile not found. Please try signing up again.")
        return
      }

      // Update the user's role to 'user' in the database
      const updatedProfile = await DatabaseService.updateUserRole(user.id, 'user')
      
      if (!updatedProfile) {
        toast.error("Failed to update user role")
        return
      }

      // Redirect to user dashboard
      router.push(`/dashboard?role=user`)
      toast.success(`Join request sent to ${company.name}! You'll be notified when they review your request.`)
    } catch (error) {
      console.error('Error in handleCompanySelected:', error)
      toast.error("An error occurred while setting up your account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToRoleSelection = () => {
    setShowCompanySearch(false)
    setSelectedRole(null)
  }

  if (showCompanySearch) {
    return (
      <CompanySearch
        onCompanySelected={handleCompanySelected}
        onBack={handleBackToRoleSelection}
      />
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Choose Your Role</CardTitle>
        <CardDescription>
          Select the role that best describes your relationship with RostrIQ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSelectedRole('user')}
            className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left hover:border-primary/50 ${
              selectedRole === 'user'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                selectedRole === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">I am a user</h3>
                <p className="text-sm text-muted-foreground">
                  I work for a company and need access to my schedule and team information
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('owner')}
            className={`w-full p-4 border-2 rounded-lg transition-all duration-200 text-left hover:border-primary/50 ${
              selectedRole === 'owner'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                selectedRole === 'owner' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">I am an owner for the company</h3>
                <p className="text-sm text-muted-foreground">
                  I manage a company and need to set up workforce management for my team
                </p>
              </div>
            </div>
          </button>
        </div>

        <Button
          onClick={handleRoleSelection}
          disabled={!selectedRole || isLoading}
          className="w-full"
        >
          {isLoading ? 'Setting up your account...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  )
}
