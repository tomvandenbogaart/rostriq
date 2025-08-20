'use client'

import { AuthGuard } from '@/components/auth-guard'
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Account Settings
            </h1>
            <p className="text-lg text-gray-600">
              Manage your personal account information and preferences
            </p>
          </div>
          
          {user && <AccountSettingsForm user={user} />}
        </div>
      </div>
    </AuthGuard>
  )
}
