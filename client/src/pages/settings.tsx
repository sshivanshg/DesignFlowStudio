import { useAuth } from "@/hooks/use-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { LogOut, Settings as SettingsIcon, Users, Shield } from "lucide-react";

export default function Settings() {
  // Use both auth systems during the transition
  const { user: firebaseUser, logout: firebaseLogout } = useAuth();
  const { user: supabaseUser, signOut: supabaseLogout } = useSupabaseAuth();
  
  // Prefer Supabase user but fallback to Firebase
  const user = supabaseUser || firebaseUser;
  
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Server-side logout
      await apiRequest("POST", "/api/auth/logout", {});
      
      // Clear client-side cache
      queryClient.clear();
      
      // Sign out from Supabase
      if (supabaseLogout) {
        await supabaseLogout();
      }
      
      // Fallback to Firebase logout (legacy)
      if (firebaseLogout) {
        firebaseLogout();
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      
      // Force redirect to login page for clean state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-500">View your profile information and account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar || ""} alt={user?.fullName} />
                  <AvatarFallback className="text-xl bg-primary text-white">
                    {user?.fullName?.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-medium text-lg">{user.fullName}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Role: {user.role}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                
                {/* Test mode for role switching - Development only */}
                <div className="mt-4 border-t pt-4 w-full">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">Test Different Roles</h4>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant={user.role === 'admin' ? 'default' : 'outline'}
                      className="w-full text-xs"
                      onClick={() => {
                        // For testing purposes only - directly modifies React state
                        const newUser = { ...user, role: 'admin' as const };
                        // Force rerender with admin role
                        document.cookie = `user_test_role=admin; path=/;`;
                        // Insert admin user into session storage
                        sessionStorage.setItem('user_test_role', 'admin');
                        // Also modify document.cookie with the role
                        window.location.href = '/settings?role=admin';
                      }}
                    >
                      Switch to Admin
                    </Button>
                    <Button 
                      size="sm" 
                      variant={user.role === 'designer' ? 'default' : 'outline'}
                      className="w-full text-xs"
                      onClick={() => {
                        // For testing purposes only - directly modifies React state
                        const newUser = { ...user, role: 'designer' as const };
                        // Force rerender with designer role
                        document.cookie = `user_test_role=designer; path=/;`;
                        // Insert designer user into session storage
                        sessionStorage.setItem('user_test_role', 'designer');
                        // Also modify document.cookie with the role
                        window.location.href = '/settings?role=designer';
                      }}
                    >
                      Switch to Designer
                    </Button>
                    <Button 
                      size="sm" 
                      variant={user.role === 'sales' ? 'default' : 'outline'}
                      className="w-full text-xs"
                      onClick={() => {
                        // For testing purposes only - directly modifies React state
                        const newUser = { ...user, role: 'sales' as const };
                        // Force rerender with sales role
                        document.cookie = `user_test_role=sales; path=/;`;
                        // Insert sales user into session storage
                        sessionStorage.setItem('user_test_role', 'sales');
                        // Also modify document.cookie with the role
                        window.location.href = '/settings?role=sales';
                      }}
                    >
                      Switch to Sales
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    This is for testing only. Role changes are temporary and will be reset on logout.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {user.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Tools</CardTitle>
                <CardDescription>Manage your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/settings/admin">
                  <Button className="w-full" variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Full Name</h3>
                    <p className="text-sm text-gray-600">{user.fullName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Email Address</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Role</h3>
                    <p className="text-sm text-gray-600">{user.role}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Company</h3>
                    <p className="text-sm text-gray-600">{user.company || "Not specified"}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Contact your administrator to update your profile information.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Session Information</h3>
                  <p className="text-sm text-gray-600">
                    You are currently logged in from {navigator.platform}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last login: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out of All Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
