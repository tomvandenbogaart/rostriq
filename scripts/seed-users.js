// Seed script to create test users using Supabase client
// This uses the proper Supabase auth flow and the new company invitations system

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54331'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)


async function seedUsers() {
  try {
    console.log('Creating test users through proper authentication flow...')

    // Create Tom (company owner)
    console.log('Creating Tom...')
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

    if (tomError && tomError.code !== 'user_already_exists') {
      console.error('Error creating Tom:', tomError)
      return
    }

    if (tomError && tomError.code === 'user_already_exists') {
      console.log('ℹ️  Tom already exists: tom@softomic.nl')
    } else {
      console.log('✅ Created Tom:', tomUser.user?.email)
      console.log('User ID:', tomUser.user?.id)
    }

    console.log('✅ Only creating Tom and company setup for testing')

    // Wait a moment for user profiles to be created by trigger
    console.log('Waiting for database trigger to create user profiles...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Sign in as Tom to set up company and profile
    console.log('Signing in as Tom to set up company...')
    const { data: tomSignIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'tom@softomic.nl',
      password: 'password123'
    })

    if (signInError) {
      console.error('Error signing in as Tom:', signInError)
      return
    }

    console.log('✅ Signed in as Tom')

    console.log('✅ User profile created automatically by database trigger')

    // Get the existing company (created by seed.sql)
    let { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('name', 'Softomic')
      .single()

    if (companyError) {
      console.log('Company not found, creating it...')
      // Create company using admin client to bypass RLS issues
      const { data: newCompany, error: createCompanyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: 'Softomic',
          description: 'A software company focused on innovative solutions',
          industry: 'Technology',
          size: '1-10',
          website: 'http://www.softomic.nl',
          logo_url: 'https://lh3.googleusercontent.com/p/AF1QipORLLTEMoyOhVoN9vDQwuyGnLe3D5BeRUVN1pO6=s680-w680-h510-rw',
          email: 'tom@softomic.nl'
        })
        .select()
        .single()

      if (createCompanyError) {
        console.error('Error creating company:', createCompanyError)
        return
      }

      company = newCompany
      console.log('✅ Created new company:', company.name)
    } else {
      console.log('✅ Found existing company:', company.name)
    }

    // Get Tom's profile ID using admin client
    const { data: tomProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_id', tomSignIn.user.id)
      .single()

    if (profileError) {
      console.error('Error getting Tom profile:', profileError)
      return
    }

    // Add Tom as company owner using admin client
    const { error: memberError } = await supabaseAdmin
      .from('company_members')
      .insert({
        company_id: company.id,
        user_id: tomProfile.id,
        role: 'owner'
      })

    if (memberError) {
      if (memberError.code === '23505') {
        console.log('ℹ️  Tom is already a company owner')
      } else {
        console.error('Error adding Tom as company owner:', memberError)
        return
      }
    } else {
      console.log('✅ Added Tom as company owner')
    }

    // Update Tom's user profile role to 'owner' to match his company role
    const { error: roleUpdateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: 'owner' })
      .eq('user_id', tomSignIn.user.id)

    if (roleUpdateError) {
      console.error('Error updating Tom profile role:', roleUpdateError)
      return
    }

    console.log('✅ Updated Tom profile role to owner')

    // Create company functions for Softomic
    console.log('Creating company functions...')
    const commonFunctions = [
      {
        name: 'Software Development',
        description: 'Core software development and programming tasks',
        color: '#3b82f6' // Blue
      },
      {
        name: 'Frontend Development',
        description: 'User interface and frontend development work',
        color: '#10b981' // Green
      },
      {
        name: 'Backend Development',
        description: 'Server-side and backend development work',
        color: '#f59e0b' // Amber
      },
      {
        name: 'DevOps & Infrastructure',
        description: 'DevOps, deployment, and infrastructure management',
        color: '#8b5cf6' // Purple
      },
      {
        name: 'Quality Assurance',
        description: 'Testing, QA, and quality control',
        color: '#ef4444' // Red
      },
      {
        name: 'Project Management',
        description: 'Project coordination and management tasks',
        color: '#06b6d4' // Cyan
      },
      {
        name: 'Design & UX',
        description: 'User experience design and visual design',
        color: '#ec4899' // Pink
      },
      {
        name: 'Business Analysis',
        description: 'Requirements gathering and business analysis',
        color: '#84cc16' // Lime
      }
    ]

    for (const func of commonFunctions) {
      const { error: functionError } = await supabaseAdmin
        .from('company_functions')
        .insert({
          company_id: company.id,
          name: func.name,
          description: func.description,
          color: func.color,
          created_by: tomProfile.id
        })
        .select()
        .single()

      if (functionError) {
        console.error(`Error creating function "${func.name}":`, functionError)
      } else {
        console.log(`✅ Created function: ${func.name}`)
      }
    }

    // Assign Tom to Software Development as primary function
    console.log('Assigning Tom to Software Development function...')
    const { data: softwareDevFunction, error: getFunctionError } = await supabaseAdmin
      .from('company_functions')
      .select('id')
      .eq('company_id', company.id)
      .eq('name', 'Software Development')
      .single()

    if (!getFunctionError && softwareDevFunction) {
      const { error: assignmentError } = await supabaseAdmin
        .from('company_function_assignments')
        .insert({
          company_id: company.id,
          user_id: tomProfile.id,
          function_id: softwareDevFunction.id,
          is_primary: true,
          assigned_by: tomProfile.id
        })

      if (assignmentError) {
        console.error('Error assigning Tom to Software Development function:', assignmentError)
      } else {
        console.log('✅ Assigned Tom to Software Development function')
      }
    }

    console.log('✅ Company functions created and assigned')

    // Sign out Tom
    await supabase.auth.signOut()
    console.log('Signed out Tom')

    console.log('✅ Company setup complete - ready for testing invitations')

    console.log('\n🎉 Seed completed successfully!')
    console.log('You can now sign in with:')
    console.log('- tom@softomic.nl (password: password123) - Company Owner')
    console.log('\nCompany setup complete - ready for testing the invitation system')
    console.log('Use the company invitations manager to send invitations to new users')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

seedUsers()