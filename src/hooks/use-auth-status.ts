import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseAuthStatusReturn {
  isAuthenticated: boolean;
  userEmail: string | null;
  refreshAuth: () => Promise<void>;
}

export function useAuthStatus(): UseAuthStatusReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('checkAuthStatus: User authenticated:', user.email);
      setIsAuthenticated(true);
      setUserEmail(user.email || null);
    } else {
      console.log('checkAuthStatus: No user found');
      setIsAuthenticated(false);
      setUserEmail(null);
    }
  };

  const refreshAuth = async (): Promise<void> => {
    console.log('Manual auth refresh triggered');
    await checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Add a more frequent auth check for when users return from signup
    const authCheckInterval = setInterval(checkAuthStatus, 2000); // Check every 2 seconds
    
    return () => clearInterval(authCheckInterval);
  }, []);

  return {
    isAuthenticated,
    userEmail,
    refreshAuth,
  };
}
