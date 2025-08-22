import { supabase } from './supabase'
import { UserProfile } from '@/types/database'

export class UserProfileService {
  /**
   * Get user profile with retry logic to handle timing issues
   * This is needed because there's a delay between user creation and the database trigger
   */
  static async getUserProfile(authUserId: string): Promise<{ userProfile: UserProfile | null; error: string | null }> {
    let userProfile = null
    let profileError = null
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries && !userProfile) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUserId)
        .single()

      if (error) {
        profileError = error
        // If it's a "not found" error and we haven't exceeded retries, wait and try again
        if (error.code === 'PGRST116' && retryCount < maxRetries - 1) {
          retryCount++
          const waitTime = 1000 * retryCount
          console.log(`User profile not found, retrying in ${waitTime}ms... (attempt ${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      } else {
        userProfile = data
        break
      }
    }

    if (profileError || !userProfile) {
      return { 
        userProfile: null, 
        error: 'User profile not found - please try refreshing the page' 
      }
    }

    return { userProfile, error: null }
  }

  /**
   * Wait for user profile to be created (useful for components that need to ensure profile exists)
   */
  static async waitForUserProfile(authUserId: string, maxWaitTime = 10000): Promise<{ userProfile: UserProfile | null; error: string | null }> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      const { userProfile, error } = await this.getUserProfile(authUserId)
      
      if (userProfile) {
        return { userProfile, error: null }
      }
      
      // Wait 500ms before next attempt
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return { 
      userProfile: null, 
      error: 'User profile creation timeout - please try refreshing the page' 
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(profileId: string, updates: Partial<UserProfile>): Promise<{ userProfile: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single()

      if (error) {
        return { userProfile: null, error: error.message }
      }

      return { userProfile: data, error: null }
    } catch (error) {
      return { userProfile: null, error: 'Failed to update user profile' }
    }
  }
}
