'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)

  const testSignUp = async () => {
    setLoading(true)
    try {
      console.log('Testing signup...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Signup result:', { data, error })
      setResult({ data, error })

      if (data.user) {
        console.log('User created:', data.user)
        console.log('Session:', data.session)
        
        // Check if user profile was created
        setTimeout(async () => {
          try {
            if (data.user) {
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', data.user.id)
                .single()

              console.log('Profile check result:', { profile, profileError })
              setResult((prev: unknown) => ({ ...(prev as Record<string, unknown>), profile, profileError }))
            }
          } catch (e) {
            console.error('Error checking profile:', e)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setResult({ error })
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    try {
      console.log('Testing signin...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Signin result:', { data, error })
      setResult({ signinData: data, signinError: error })
    } catch (error) {
      console.error('Signin error:', error)
      setResult({ signinError: error })
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('Current user:', { user, error })
      setResult((prev: unknown) => ({ ...(prev as Record<string, unknown>), currentUser: user, currentUserError: error }))
    } catch (error) {
      console.error('Error getting user:', error)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setResult((prev: unknown) => ({ ...(prev as Record<string, unknown>), signedOut: true }))
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Authentication Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={testSignUp} disabled={loading}>
                {loading ? 'Testing...' : 'Test Sign Up'}
              </Button>
              
              <Button onClick={testSignIn} disabled={loading} variant="outline">
                Test Sign In
              </Button>
              
              <Button onClick={checkUser} variant="outline">
                Check User
              </Button>
              
              <Button onClick={signOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {Boolean(result) && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
