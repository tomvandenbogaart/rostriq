// Seed script to create test users using Supabase client
// This uses the proper Supabase auth flow

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54331'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function seedUsers() {
  try {
    console.log('Creating test users...')

    // Create Tom (company owner)
    const { data: tomUser, error: tomError } = await supabase.auth.signUp({
      email: 'tom@softomic.nl',
      password: 'password123',
      options: {
        data: {
          first_name: 'Tom',
          last_name: 'van den Bogaart',
          role: 'owner'
        }
      }
    })

    if (tomError) {
      console.error('Error creating Tom:', tomError)
      return
    }

    console.log('Created Tom:', tomUser.user?.email)

    // Create Boga (join request sender)
    const { data: bogaUser, error: bogaError } = await supabase.auth.signUp({
      email: 'bogatom98@gmail.com',
      password: 'password123',
      options: {
        data: {
          first_name: 'Boga',
          last_name: 'Tom',
          role: 'user'
        }
      }
    })

    if (bogaError) {
      console.error('Error creating Boga:', bogaError)
      return
    }

    console.log('Created Boga:', bogaUser.user?.email)

    // Wait a moment for user profiles to be created by trigger
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Sign in as Tom to create company
    const { data: tomSignIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'tom@softomic.nl',
      password: 'password123'
    })

    if (signInError) {
      console.error('Error signing in as Tom:', signInError)
      return
    }

    console.log('Signed in as Tom')

    // Update Tom's profile to be owner
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'owner', 
        first_name: 'Tom', 
        last_name: 'van den Bogaart',
        company_name: 'Softomic'
      })
      .eq('user_id', tomSignIn.user.id)

    if (updateError) {
      console.error('Error updating Tom profile:', updateError)
      return
    }

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Softomic',
        description: 'A software company focused on innovative solutions',
        industry: 'Technology',
        email: 'tom@softomic.nl'
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      return
    }

    console.log('Created company:', company.name)

    // Get Tom's profile ID
    const { data: tomProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', tomSignIn.user.id)
      .single()

    if (profileError) {
      console.error('Error getting Tom profile:', profileError)
      return
    }

    // Add Tom as company owner
    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: company.id,
        user_id: tomProfile.id,
        role: 'owner'
      })

    if (memberError) {
      console.error('Error adding Tom as company owner:', memberError)
      return
    }

    // Sign out Tom
    await supabase.auth.signOut()

    // Get Boga's profile ID using admin client to bypass RLS
    const { data: bogaProfile, error: bogaProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', 'bogatom98@gmail.com')
      .single()

    if (bogaProfileError) {
      console.error('Error getting Boga profile:', bogaProfileError)
      return
    }

    // Create join request from Boga using admin client to bypass RLS
    const { error: joinRequestError } = await supabaseAdmin
      .from('company_join_requests')
      .insert({
        company_id: company.id,
        user_id: bogaProfile.id,
        status: 'pending'
      })

    if (joinRequestError) {
      console.error('Error creating join request:', joinRequestError)
      return
    }

    console.log('✅ Seed completed successfully!')
    console.log('You can now sign in with:')
    console.log('- tom@softomic.nl (password: password123) - Company Owner')
    console.log('- bogatom98@gmail.com (password: password123) - User with join request')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

seedUsers()
