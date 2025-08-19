'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugSignupPage() {
  const [email, setEmail] = useState('debug@example.com')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testSignUp = async () => {
    setLoading(true)
    setLogs([])
    
    try {
      addLog('Starting signup process...')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      addLog(`Signup result: ${error ? 'ERROR' : 'SUCCESS'}`)
      addLog(`User: ${data.user ? 'Created' : 'Not created'}`)
      addLog(`Session: ${data.session ? 'Active' : 'No session'}`)
      
      if (error) {
        addLog(`Error: ${error.message}`)
        return
      }

      if (data.user) {
        addLog(`User ID: ${data.user.id}`)
        addLog(`User Email: ${data.user.email}`)
        
        // Wait a moment for the database trigger to fire
        addLog('Waiting for database trigger...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check if user profile was created
        addLog('Checking if user profile was created...')
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (profileError) {
          addLog(`Profile check error: ${profileError.message}`)
        } else if (profile) {
          addLog(`Profile found: ID=${profile.id}, Role=${profile.role}`)
        } else {
          addLog('No profile found - trigger may not be working')
        }
        
        // Try to sign in
        addLog('Attempting to sign in...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (signInError) {
          addLog(`Sign in error: ${signInError.message}`)
        } else {
          addLog('Sign in successful')
          addLog(`Session active: ${!!signInData.session}`)
        }
      }
    } catch (error) {
      addLog(`Unexpected error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        addLog(`Get user error: ${error.message}`)
      } else if (user) {
        addLog(`Current user: ${user.email} (${user.id})`)
        
        // Check profile again
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileError) {
          addLog(`Profile check error: ${profileError.message}`)
        } else if (profile) {
          addLog(`Profile: ID=${profile.id}, Role=${profile.role}`)
        } else {
          addLog('No profile found')
        }
      } else {
        addLog('No current user')
      }
    } catch (error) {
      addLog(`Error checking user: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug Signup Process</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Signup and Database Trigger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={testSignUp} disabled={loading}>
                {loading ? 'Testing...' : 'Test Complete Signup Flow'}
              </Button>
              
              <Button onClick={checkCurrentUser} variant="outline">
                Check Current User
              </Button>
              
              <Button onClick={clearLogs} variant="outline">
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet. Run a test to see what happens.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
