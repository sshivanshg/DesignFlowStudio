import { useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  // For testing purposes only - override the role based on URL params or session storage
  const modifiedContext = useMemo(() => {
    if (!context.user) return context;
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    // Check session storage
    const sessionRole = sessionStorage.getItem('user_test_role');
    
    // Check cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    const cookieRole = getCookie('user_test_role');
    
    // Determine which role to use (prioritize URL param, then session, then cookie)
    const testRole = roleParam || sessionRole || cookieRole;
    
    if (testRole && ['admin', 'designer', 'sales'].includes(testRole)) {
      console.log(`[TEST MODE] Overriding user role to: ${testRole}`);
      
      // Return a new context with the modified user
      return {
        ...context,
        user: {
          ...context.user,
          role: testRole as 'admin' | 'designer' | 'sales'
        }
      };
    }
    
    return context;
  }, [context, window.location.search]);
  
  return modifiedContext;
}
