import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import supabaseClient from '@/lib/supabase';

// Type assertion to avoid TS errors
const supabase = supabaseClient as any;

export default function ClearAuth() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [_, setLocation] = useLocation();

  const clearAuthData = async () => {
    setIsClearing(true);
    setMessage('Clearing authentication data...');

    try {
      // Clear Supabase auth data
      await supabase.auth.signOut();
      
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
      
      setMessage('Authentication data cleared successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
      
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
          </CardHeader>
          
          <CardContent className="flex flex-col items-center space-y-4">
            {isClearing ? (
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            ) : null}
            
            {message && (
              <p className="text-center">{message}</p>
            )}
            
            <Button 
              type="button" 
              onClick={() => setLocation('/login')}
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}