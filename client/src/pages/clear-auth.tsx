import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import supabaseClient from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Type assertion to avoid TS errors
const supabase = supabaseClient as any;

export default function ClearAuth() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [manualSignOutNeeded, setManualSignOutNeeded] = useState(false);
  const [_, setLocation] = useLocation();

  const clearAuthData = async () => {
    setIsClearing(true);
    setMessage('Clearing authentication data...');

    try {
      // Try to get current session to check if we're still logged in
      const { data: sessionData } = await supabase.auth.getSession();
      const isLoggedIn = !!sessionData?.session;
      
      console.log('Current auth state:', isLoggedIn ? 'Logged in' : 'Not logged in');
      
      if (isLoggedIn) {
        // If still logged in, try to force sign out
        try {
          const { error } = await supabase.auth.signOut({ scope: 'global' });
          if (error) {
            console.error('Error signing out from Supabase:', error);
            setManualSignOutNeeded(true);
          }
        } catch (signOutError) {
          console.error('Exception during Supabase signOut:', signOutError);
          setManualSignOutNeeded(true);
        }
      }
      
      // Clear all local storage
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Clear server-side session
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error clearing server session:', error);
      }
      
      // Create a fresh Supabase client to verify we're truly logged out
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseAnonKey) {
          const freshClient = createClient(supabaseUrl, supabaseAnonKey);
          const { data } = await freshClient.auth.getSession();
          const stillLoggedIn = !!data.session;
          
          if (stillLoggedIn) {
            console.error('Still logged in even after clearing all data!');
            setManualSignOutNeeded(true);
          }
        }
      } catch (error) {
        console.error('Error checking fresh client state:', error);
      }
      
      if (!manualSignOutNeeded) {
        setMessage('Authentication data cleared successfully! Redirecting to login...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          // Force a full page reload to clear any remaining state
          window.location.href = '/login';
        }, 2000);
      } else {
        setMessage('Please use the button below to complete the sign out process');
      }
      
    } catch (error) {
      console.error('Error clearing auth data:', error);
      setMessage('Error clearing authentication data. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    // Auto-clear on page load
    clearAuthData();
  }, []);
  
  // Function for manual sign out when automatic fails
  const forceManualSignOut = async () => {
    setIsClearing(true);
    setMessage('Forcing manual sign out...');
    
    try {
      // Try with global scope to invalidate all sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Clear server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setMessage('Manual sign out completed. Redirecting...');
      
      // Force a complete reload of the application
      setTimeout(() => {
        window.location.href = '/login?t=' + Date.now();
      }, 1500);
      
    } catch (error) {
      console.error('Manual sign out failed:', error);
      setMessage('Manual sign out failed. Please try closing all browser windows and reopening the app.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Clearing Authentication
            </CardTitle>
            <CardDescription className="text-center">
              Resetting all authentication state...
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center space-y-4">
            {isClearing ? (
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            ) : null}
            
            {message && (
              <p className="text-center">{message}</p>
            )}
            
            {manualSignOutNeeded ? (
              <div className="space-y-4 w-full">
                <p className="text-sm text-amber-600 text-center">
                  Automatic sign out didn't complete successfully.
                  Please use the button below to force a complete sign out.
                </p>
                <Button 
                  type="button" 
                  onClick={forceManualSignOut}
                  className="w-full"
                  variant="destructive"
                  disabled={isClearing}
                >
                  Force Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                type="button" 
                onClick={() => window.location.href = '/login'}
                className="w-full mt-4"
              >
                Go to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}