'use client'

import { AuthGuard } from '@/components/auth-guard'
import { Header } from '@/components/header'
import { AccountSettingsForm } from '@/components/account-settings-form'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function AccountSettingsPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        setUser(currentUser)
      }
    }
    getUser()
  }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Account Settings
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your personal account information and preferences
              </p>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-muted-foreground mb-4">
                This page allows you to update your account information, change your email, and manage your password.
              </p>
            </div>
            
            {user && <AccountSettingsForm user={user} />}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
