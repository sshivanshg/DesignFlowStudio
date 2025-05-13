import React, { createContext, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  auth, 
  setupRecaptcha, 
  signOut as firebaseSignOut 
} from "@/lib/firebase";
import { 
  User as FirebaseUser, 
  ConfirmationResult,
  signInWithCredential, 
  PhoneAuthProvider,
  onAuthStateChanged
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  confirmationResult: ConfirmationResult | null;
  login: (username: string, password: string) => Promise<void>;
  loginWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  register: (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
    phone?: string;
    role?: 'admin' | 'designer' | 'sales';
    company?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  confirmationResult: null,
  login: async () => {},
  loginWithPhone: async () => {},
  verifyOtp: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      
      if (currentUser) {
        try {
          // Get ID token to pass to backend
          const idToken = await currentUser.getIdToken();
          
          // Fetch user data from our database
          const response = await fetch("/api/auth/firebase-auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              firebaseUid: currentUser.uid,
              phone: currentUser.phoneNumber,
              idToken 
            }),
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            console.error("Failed to get user data");
          }
        } catch (error) {
          console.error("Failed to process Firebase auth:", error);
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Legacy session check (traditional authentication)
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to check auth status:", error);
      } finally {
        if (!firebaseUser) {
          setIsLoading(false);
        }
      }
    }

    if (!firebaseUser) {
      checkAuthStatus();
    }
  }, [firebaseUser]);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.user.fullName}!`,
      });
      
      // Reset query cache
      queryClient.clear();
      
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: {
    username: string;
    password: string;
    email: string;
    fullName: string;
    company?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      setUser(data.user);
      
      toast({
        title: "Registered successfully",
        description: `Welcome, ${data.user.fullName}!`,
      });
      
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Phone OTP login function
  const loginWithPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
    setIsLoading(true);
    try {
      // Setup reCAPTCHA and send OTP
      const confirmation = await setupRecaptcha(phoneNumber, recaptchaContainerId);
      setConfirmationResult(confirmation);
      
      toast({
        title: "Verification code sent",
        description: "Please enter the code sent to your phone",
      });
      
      return confirmation;
    } catch (error) {
      toast({
        title: "Failed to send verification code",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify OTP function
  const verifyOtp = async (otp: string) => {
    setIsLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No confirmation result found. Please send the verification code again.");
      }
      
      // Confirm the OTP
      const result = await confirmationResult.confirm(otp);
      setFirebaseUser(result.user);
      
      // Get ID token
      const idToken = await result.user.getIdToken();
      
      // Send to our backend to create/update user
      const response = await fetch("/api/auth/firebase-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          phone: result.user.phoneNumber,
          idToken,
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to authenticate with server");
      }
      
      const data = await response.json();
      setUser(data.user);
      
      toast({
        title: "Logged in successfully",
        description: `Welcome${data.user?.fullName ? ', ' + data.user.fullName : ''}!`,
      });
      
      // Reset query cache
      queryClient.clear();
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
      
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Sign out from Firebase
      if (firebaseUser) {
        await firebaseSignOut();
      }
      
      // Sign out from our backend
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      setUser(null);
      setFirebaseUser(null);
      
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
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser,
      isLoading, 
      confirmationResult,
      login, 
      loginWithPhone,
      verifyOtp,
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
