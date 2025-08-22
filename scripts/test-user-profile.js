// Test script to verify user profile creation and retry logic
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54331'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUserProfileCreation() {
  try {
    console.log('Testing user profile creation...')
    
    // Create a test user
    const testEmail = `test-${Date.now()}@example.com`
    const { data: userData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    })

    if (signupError) {
      console.error('Signup error:', signupError)
      return
    }

    console.log('✅ Test user created:', testEmail)
    console.log('User ID:', userData.user?.id)

    // Wait a moment for the trigger to fire
    console.log('Waiting for database trigger...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Try to get the user profile with retry logic
    let userProfile = null
    let profileError = null
    let retryCount = 0
    const maxRetries = 3
    
    console.log('Attempting to fetch user profile...')
    
    while (retryCount < maxRetries && !userProfile) {
      console.log(`Attempt ${retryCount + 1}/${maxRetries}...`)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .single()

      if (error) {
        profileError = error
        console.log(`Error on attempt ${retryCount + 1}:`, error.message)
        
        // If it's a "not found" error and we haven't exceeded retries, wait and try again
        if (error.code === 'PGRST116' && retryCount < maxRetries - 1) {
          retryCount++
          const waitTime = 1000 * retryCount
          console.log(`Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      } else {
        userProfile = data
        console.log('✅ User profile found on attempt', retryCount + 1)
        break
      }
    }

    if (profileError || !userProfile) {
      console.error('❌ Failed to get user profile after all retries')
      console.error('Final error:', profileError)
    } else {
      console.log('✅ Success! User profile:', userProfile)
    }

    // Clean up - delete the test user
    console.log('Cleaning up test user...')
    await supabase.auth.signOut()
    
    // Note: We can't easily delete the auth user from the client side
    // In a real scenario, you'd want to clean this up properly
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testUserProfileCreation()
