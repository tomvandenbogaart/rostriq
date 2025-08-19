'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DatabaseService } from '@/lib/database'
import { Header } from '@/components/header'
import { RoleSelection } from '@/components/role-selection'

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/signin')
          return
        }

        // Check if user profile exists first
        const userProfile = await DatabaseService.getUserProfile(user.id)
        console.log('User profile from database:', userProfile)
        
        if (userProfile && userProfile.role && userProfile.role !== 'user') {
          // User already has a specific role set
          console.log('User already has role, redirecting to dashboard')
          router.push(`/dashboard?role=${userProfile.role}`)
          return
        }

        // If user profile doesn't exist yet, or has default 'user' role, allow role selection
        console.log('User profile not found or has default role, allowing role selection')
        
        // Add a small delay to see if the profile gets created
        if (!userProfile) {
          console.log('Waiting for profile to be created...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check again
          const retryProfile = await DatabaseService.getUserProfile(user.id)
          console.log('Retry profile check:', retryProfile)
          
          if (retryProfile && retryProfile.role && retryProfile.role !== 'user') {
            console.log('Profile found on retry, redirecting to dashboard')
            router.push(`/dashboard?role=${retryProfile.role}`)
            return
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/signin')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to RostrIQ!</h1>
            <p className="text-muted-foreground mt-2">
              Let&apos;s get you set up with the right experience
            </p>
          </div>
          
          <RoleSelection />
        </div>
      </main>
    </>
  )
}
