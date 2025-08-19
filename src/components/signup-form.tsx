'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        // Check if we need to confirm email or if user is automatically signed in
        if (data.user && !data.session) {
          // Email confirmation required
          toast.success("Account created! Please check your email to confirm your account.")
        } else if (data.session) {
          // User is automatically signed in
          toast.success("Account created successfully! Welcome to RostrIQ!")
          // Clear form on success
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          // Redirect to role selection
          router.push('/role-selection')
        } else {
          // Try to sign in the user manually
          try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })
            
            if (signInError) {
              toast.error("Account created but couldn't sign you in automatically. Please sign in manually.")
              router.push('/signin')
            } else {
              toast.success("Account created successfully! Welcome to RostrIQ!")
              // Clear form on success
              setEmail('')
              setPassword('')
              setConfirmPassword('')
              // Redirect to role selection
              router.push('/role-selection')
            }
          } catch (signInError) {
            toast.error("Account created but couldn't sign you in automatically. Please sign in manually.")
            router.push('/signin')
          }
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join RostrIQ and start managing your workforce efficiently
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
