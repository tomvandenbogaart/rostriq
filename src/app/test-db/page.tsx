'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DatabaseService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestDBPage() {
  const [user, setUser] = useState<unknown>(null)
  const [profile, setProfile] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const checkUser = async () => {
    setLoading(true)
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Auth error:', error)
        return
      }

      if (currentUser) {
        setUser(currentUser)
        console.log('Current user:', currentUser)
        
        // Check if profile exists
        const userProfile = await DatabaseService.getUserProfile(currentUser.id)
        setProfile(userProfile)
        console.log('User profile:', userProfile)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: (user as Record<string, unknown>).id as string,
          email: (user as Record<string, unknown>).email as string || '',
          role: 'user'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return
      }

      setProfile(data)
      console.log('Profile created:', data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Database Test Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Database Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkUser} disabled={loading}>
              {loading ? 'Checking...' : 'Check Current User'}
            </Button>
            
            {Boolean(user) && (
              <div className="p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">User Info:</h3>
                <pre className="text-sm mt-2">{JSON.stringify(user, null, 2)}</pre>
              </div>
            )}
            
            {Boolean(profile) && (
              <div className="p-4 bg-green-100 rounded">
                <h3 className="font-semibold">Profile Info:</h3>
                <pre className="text-sm mt-2">{JSON.stringify(profile, null, 2)}</pre>
              </div>
            )}
            
            {Boolean(user) && !profile && (
              <div className="p-4 bg-yellow-100 rounded">
                <h3 className="font-semibold">No Profile Found</h3>
                <p>User exists but no profile found. This might be why the role selection is failing.</p>
                <Button onClick={createProfile} className="mt-2">
                  Create Profile Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
