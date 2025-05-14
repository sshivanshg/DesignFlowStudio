import React, { createContext, useState, useEffect, useContext } from "react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import supabase from "@/lib/supabase";
import { Session, AuthError, User as SupabaseUser } from '@supabase/supabase-js';

interface SupabaseAuthContextType {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  user: User | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, userData: {
    username: string;
    fullName: string;
    company?: string;
    role?: 'admin' | 'designer' | 'sales';
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  session: null,
  supabaseUser: null,
  user: null,
  isLoading: true,
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

// Hook to use auth context
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user || null);
        setIsLoading(true);
        
        if (session) {
          try {
            // Fetch user data from our backend
            const response = await fetch("/api/auth/supabase-auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                supabaseUid: session.user.id,
                email: session.user.email,
                session: session
              }),
              credentials: "include",
            });

            if (response.ok) {
              const data = await response.json();
              console.log("User data from backend:", data.user);
              setUser(data.user);
            } else {
              console.error("Failed to get user data from backend");
            }
          } catch (error) {
            console.error("Failed to process Supabase auth:", error);
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSupabaseUser(session?.user || null);
      
      if (session) {
        try {
          const response = await fetch("/api/auth/supabase-auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              supabaseUid: session.user.id,
              email: session.user.email,
              session: session
            }),
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Initial session check - User data from backend:", data.user);
            setUser(data.user);
          } else {
            console.error("Failed to get user data from backend during session check");
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
      
      setIsLoading(false);
    };
    
    checkSession();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back!`,
      });
      
      // Reset query cache
      queryClient.clear();
      
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Login failed",
        description: authError.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      console.log("Starting Google Sign In with Supabase...");
      
      // Get the current URL to redirect back to the same page after auth
      // This helps prevent login loops when we're on a protected page
      const currentPath = window.location.pathname;
      const redirectPath = currentPath === '/login' ? '/dashboard' : currentPath;
      const redirectUrl = `${window.location.origin}${redirectPath}`;
      
      console.log("Redirect URL after auth:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account', // Always show account selection
          }
        },
      });

      if (error) {
        console.error("Supabase Google Sign In error:", error);
        throw error;
      }
      
      console.log("Supabase Google Sign In initiated successfully");
      
    } catch (error) {
      console.error("Failed to initiate Google sign in:", error);
      const authError = error as AuthError;
      toast({
        title: "Google login failed",
        description: authError.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (
    email: string, 
    password: string, 
    userData: {
      username: string;
      fullName: string;
      company?: string;
      role?: 'admin' | 'designer' | 'sales';
    }
  ) => {
    setIsLoading(true);
    try {
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName,
            company: userData.company,
            role: userData.role || 'designer',
          },
        },
      });

      if (error) throw error;
      
      // Register with our backend
      if (data.user) {
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...userData,
              email,
              supabaseUid: data.user.id,
            }),
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create user in database");
          }

          const responseData = await response.json();
          setUser(responseData.user);
          
          toast({
            title: "Registered successfully",
            description: `Welcome, ${userData.fullName}!`,
          });
        } catch (error) {
          console.error("Failed to register user in backend:", error);
          throw error;
        }
      }
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Registration failed",
        description: authError.message || "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Sign out from our backend
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      setUser(null);
      setSession(null);
      setSupabaseUser(null);
      
      toast({
        title: "Logged out successfully",
      });
      
      // Reset query cache
      queryClient.clear();
      
      // Redirect to login
      window.location.href = "/login";
      
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ 
      session, 
      supabaseUser,
      user, 
      isLoading, 
      signInWithEmail, 
      signInWithGoogle,
      signUp, 
      signOut 
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}