'use client'

import { useState, useEffect } from 'react'
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
  
  // Get invitation token and redirect from URL if available
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  // Prefill email from query string and get invitation context
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const invitedEmail = params.get('email')
      const token = params.get('token')
      const redirect = params.get('redirect')
      
      console.log('Signup form URL params:', { invitedEmail, token, redirect })
      
      if (invitedEmail) setEmail(invitedEmail)
      
      // Handle both direct token parameter and token within redirect parameter
      if (token) {
        setInvitationToken(token)
        console.log('Set invitation token from direct parameter:', token)
      } else if (redirect && redirect.includes('token=')) {
        // Extract token from redirect parameter (e.g., /join?token=abc123)
        const redirectParams = new URLSearchParams(redirect.split('?')[1] || '')
        const redirectToken = redirectParams.get('token')
        if (redirectToken) {
          setInvitationToken(redirectToken)
          console.log('Set invitation token from redirect parameter:', redirectToken)
        }
      }
      
      // If we still don't have a token, try to extract it from the redirect path
      if (!invitationToken && redirect) {
        const tokenMatch = redirect.match(/token=([^&]+)/)
        if (tokenMatch) {
          const extractedToken = tokenMatch[1]
          setInvitationToken(extractedToken)
          console.log('Extracted token from redirect path:', extractedToken)
        }
      }
      
      if (redirect) setRedirectPath(redirect)
    } catch (error) {
      console.error('Error parsing URL parameters:', error)
    }
  }, [])

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
          await handlePostSignupFlow()
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
              await handlePostSignupFlow()
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

  // Handle post-signup flow (invitation acceptance or dashboard redirect)
  const handlePostSignupFlow = async () => {
    console.log('handlePostSignupFlow called with:', { invitationToken, redirectPath })
    
    // Clear form on success
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    
    if (invitationToken) {
      // If this was an invitation signup, redirect back to join page
      // The join page will auto-accept the invitation
      console.log('Redirecting to join page with token:', invitationToken)
      toast.success("Account created! Redirecting to complete your invitation...")
      router.push(`/join?token=${invitationToken}`)
    } else {
      // Regular signup, go to dashboard
      console.log('No invitation token, redirecting to dashboard')
      router.push('/dashboard')
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
