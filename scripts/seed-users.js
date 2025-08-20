// Seed script to create test users, company, and company functions using Supabase client
// This script is self-contained and creates everything needed for testing
// This uses the proper Supabase auth flow

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

    if (tomError) {
      console.error('Error creating Tom:', tomError)
      return
    }

    console.log('✅ Created Tom:', tomUser.user?.email)
    console.log('User ID:', tomUser.user?.id)

    // Create Boga (join request sender)
    console.log('Creating Boga...')
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

    console.log('✅ Created Boga:', bogaUser.user?.email)
    console.log('User ID:', bogaUser.user?.id)

    // Create additional test users for more join requests
    const additionalUsers = [
      {
        email: 'sarah.johnson@email.com',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'user'
      },
      {
        email: 'mike.chen@email.com',
        password: 'password123',
        firstName: 'Mike',
        lastName: 'Chen',
        role: 'user'
      },
      {
        email: 'emma.wilson@email.com',
        password: 'password123',
        firstName: 'Emma',
        lastName: 'Wilson',
        role: 'user'
      },
      {
        email: 'alex.rodriguez@email.com',
        password: 'password123',
        firstName: 'Alex',
        lastName: 'Rodriguez',
        role: 'user'
      },
      {
        email: 'lisa.thompson@email.com',
        password: 'password123',
        firstName: 'Lisa',
        lastName: 'Thompson',
        role: 'user'
      }
    ]

    console.log('Creating additional test users...')
    const createdUsers = []

    for (const userData of additionalUsers) {
      try {
        const { data: user, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              role: userData.role
            }
          }
        })

        if (error && error.code !== 'user_already_exists') {
          console.error(`Error creating ${userData.firstName}:`, error.message)
          continue
        }

        if (error && error.code === 'user_already_exists') {
          console.log(`ℹ️  ${userData.firstName} already exists:`, userData.email)
        } else {
          console.log(`✅ Created ${userData.firstName}:`, user.user?.email)
        }
        
        createdUsers.push({ ...userData, email: userData.email })
      } catch (error) {
        console.log(`ℹ️  ${userData.firstName} creation skipped:`, error.message)
        createdUsers.push({ ...userData, email: userData.email })
      }
    }

    // Wait a moment for user profiles to be created by trigger
    console.log('Waiting for database trigger to create user profiles...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update all user profiles with their names using admin client
    console.log('Updating user profiles with names...')
    for (const userData of additionalUsers) {
      try {
        // Get the user profile by email
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('id, user_id')
          .eq('email', userData.email)
          .single()

        if (profileError) {
          console.log(`ℹ️  Profile not found for ${userData.firstName}:`, profileError.message)
          continue
        }

        // Update the profile with first and last name
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            first_name: userData.firstName,
            last_name: userData.lastName
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`Error updating profile for ${userData.firstName}:`, updateError)
        } else {
          console.log(`✅ Updated profile for ${userData.firstName} ${userData.lastName}`)
        }
      } catch (error) {
        console.log(`ℹ️  Profile update skipped for ${userData.firstName}:`, error.message)
      }
    }

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

    console.log('✅ Updated Tom profile to owner role')

    // Create the company
    console.log('Creating company...')
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

    console.log('✅ Created company:', company.name)

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

    console.log('✅ Added Tom as company owner')

    // Sign out Tom
    await supabase.auth.signOut()
    console.log('Signed out Tom')

    // Create join requests from all users using admin client to bypass RLS
    console.log('Creating join requests from all users...')
    
    const joinRequestMessages = [
      'Hi! I would like to join your company. I have experience in software development and would love to contribute to your projects.',
      'Hello! I\'m interested in joining Softomic. I have a background in frontend development and UI/UX design.',
      'Hi there! I\'m a backend developer looking for new opportunities. I\'d love to be part of your team.',
      'Hello! I have experience in DevOps and cloud infrastructure. I think I could add value to your company.',
      'Hi! I\'m a product manager with experience in agile methodologies. I\'d love to discuss how I can contribute.',
      'Hello! I\'m a data scientist interested in joining your team. I have experience with machine learning and analytics.'
    ]

    const joinRequestStatuses = ['pending', 'pending', 'pending', 'approved', 'rejected', 'pending']

    // Get all user profiles using admin client
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .neq('role', 'owner') // Exclude company owners

    if (profilesError) {
      console.error('Error getting user profiles:', profilesError)
      return
    }

    // Create join requests for each user
    for (let i = 0; i < allProfiles.length; i++) {
      const profile = allProfiles[i]
      const message = joinRequestMessages[i] || joinRequestMessages[0]
      const status = joinRequestStatuses[i] || 'pending'

      const { error: joinRequestError } = await supabaseAdmin
        .from('company_join_requests')
        .insert({
          company_id: company.id,
          user_id: profile.id,
          message: message,
          status: status
        })

      if (joinRequestError) {
        console.error(`Error creating join request for ${profile.email}:`, joinRequestError)
      } else {
        console.log(`✅ Created join request from ${profile.email} (${status})`)
      }
    }

    console.log('\n🎉 Seed completed successfully!')
    console.log('You can now sign in with:')
    console.log('- tom@softomic.nl (password: password123) - Tom van den Bogaart - Company Owner')
    console.log('- bogatom98@gmail.com (password: password123) - Boga Tom - User with join request')
    console.log('- sarah.johnson@email.com (password: password123) - Sarah Johnson - User with join request')
    console.log('- mike.chen@email.com (password: password123) - Mike Chen - User with join request')
    console.log('- emma.wilson@email.com (password: password123) - Emma Wilson - User with join request')
    console.log('- alex.rodriguez@email.com (password: password123) - Alex Rodriguez - User with join request')
    console.log('- lisa.thompson@email.com (password: password123) - Lisa Thompson - User with join request')
    console.log('\nJoin request statuses: 4 pending, 1 approved, 1 rejected')

    // Create company functions
    console.log('\nCreating company functions...')
    
    const companyFunctions = [
      {
        name: 'Software Development',
        description: 'Core software development and programming tasks',
        color: '#3b82f6' // Blue
      },
      {
        name: 'UI/UX Design',
        description: 'User interface and user experience design',
        color: '#8b5cf6' // Purple
      },
      {
        name: 'Project Management',
        description: 'Project planning, coordination, and delivery',
        color: '#10b981' // Green
      },
      {
        name: 'Quality Assurance',
        description: 'Testing, quality control, and bug reporting',
        color: '#f59e0b' // Amber
      },
      {
        name: 'DevOps',
        description: 'Infrastructure, deployment, and operations',
        color: '#ef4444' // Red
      },
      {
        name: 'Data Analysis',
        description: 'Data processing, analysis, and reporting',
        color: '#06b6d4' // Cyan
      }
    ]

    const createdFunctions = []

    for (const func of companyFunctions) {
      const { data: functionData, error: functionError } = await supabaseAdmin
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
        console.error(`Error creating function ${func.name}:`, functionError)
      } else {
        console.log(`✅ Created function: ${func.name}`)
        createdFunctions.push(functionData)
      }
    }

    // Assign functions to users (only to approved members)
    console.log('\nAssigning functions to users...')
    
    // Get approved join requests
    const { data: approvedRequests, error: approvedError } = await supabaseAdmin
      .from('company_join_requests')
      .select('user_id, status')
      .eq('company_id', company.id)
      .eq('status', 'approved')

    if (approvedError) {
      console.error('Error getting approved requests:', approvedError)
    } else if (approvedRequests && approvedRequests.length > 0) {
      // Assign primary functions to approved users
      const functionAssignments = [
        { functionName: 'Software Development', isPrimary: true },
        { functionName: 'UI/UX Design', isPrimary: true },
        { functionName: 'Project Management', isPrimary: true },
        { functionName: 'Quality Assurance', isPrimary: true },
        { functionName: 'DevOps', isPrimary: true },
        { functionName: 'Data Analysis', isPrimary: true }
      ]

      for (let i = 0; i < approvedRequests.length && i < functionAssignments.length; i++) {
        const request = approvedRequests[i]
        const assignment = functionAssignments[i]
        
        // Find the function by name
        const functionToAssign = createdFunctions.find(f => f.name === assignment.functionName)
        
        if (functionToAssign) {
          const { error: assignmentError } = await supabaseAdmin
            .from('company_function_assignments')
            .insert({
              company_id: company.id,
              user_id: request.user_id,
              function_id: functionToAssign.id,
              is_primary: assignment.isPrimary,
              assigned_by: tomProfile.id
            })

          if (assignmentError) {
            console.error(`Error assigning function ${assignment.functionName} to user:`, assignmentError)
          } else {
            console.log(`✅ Assigned ${assignment.functionName} to user`)
          }
        }
      }
    }

    // Also assign Tom (company owner) to Software Development as primary function
    const softwareDevFunction = createdFunctions.find(f => f.name === 'Software Development')
    if (softwareDevFunction) {
      const { error: tomAssignmentError } = await supabaseAdmin
        .from('company_function_assignments')
        .insert({
          company_id: company.id,
          user_id: tomProfile.id,
          function_id: softwareDevFunction.id,
          is_primary: true,
          assigned_by: tomProfile.id
        })

      if (tomAssignmentError) {
        console.error('Error assigning function to Tom:', tomAssignmentError)
      } else {
        console.log('✅ Assigned Software Development to Tom (company owner)')
      }
    }

    console.log('\n🎉 Company functions seeding completed!')
    console.log(`Created ${createdFunctions.length} company functions`)
    console.log('Functions available: Software Development, UI/UX Design, Project Management, Quality Assurance, DevOps, Data Analysis')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

seedUsers()
