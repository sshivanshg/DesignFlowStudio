import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";

import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import ClearAuth from "@/pages/clear-auth";
import Dashboard from "@/pages/dashboard";
import CRM from "@/pages/crm";
import Proposals from "@/pages/proposals";
import ProposalEditor from "@/pages/proposal-editor";
import Moodboard from "@/pages/moodboard";
import MoodboardEditor from "@/pages/moodboard-editor";
import Estimates from "@/pages/estimates";
import Estimate from "@/pages/estimate";
import EstimateCreate from "@/pages/estimate-create";
import Clients from "@/pages/clients";
import Settings from "@/pages/settings";
import AdminDashboard from "@/pages/settings/admin";
import ProjectTracker from "@/pages/project-tracker";
import ProjectLogs from "@/pages/project-logs";

// Client Portal Pages
import ClientPortalLogin from "@/pages/client-portal-login";
import ClientPortal from "@/pages/client-portal";
import ClientProjectDetail from "@/pages/client-project-detail";
import ClientProposalDetail from "@/pages/client-proposal-detail";
import ClientEstimateDetail from "@/pages/client-estimate-detail";
import ClientMoodboardDetail from "@/pages/client-moodboard-detail";

import { useAuth } from "@/hooks/use-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

function ProtectedRoute({ 
  children, 
  allowedRoles = ["admin", "designer", "sales"] 
}: { 
  children: React.ReactNode; 
  allowedRoles?: Array<"admin" | "designer" | "sales">;
}) {
  // Use both auth systems during transition period
  const { user: firebaseUser, isLoading: firebaseLoading } = useAuth();
  const { user: supabaseUser, isLoading: supabaseLoading, supabaseUser: authUser } = useSupabaseAuth();
  const [_, setLocation] = useLocation();
  
  // Prefer Supabase user if available, otherwise fallback to Firebase user
  const user = supabaseUser || firebaseUser;
  const isLoading = supabaseLoading || firebaseLoading;

  // If we have a Supabase auth user but no backend user data yet,
  // this might be a fresh login that hasn't created the user in our database yet
  const hasSupabaseAuthOnly = !supabaseUser && authUser && !isLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // If we have no user, redirect to login
  if (!user && !hasSupabaseAuthOnly) {
    console.log("No authenticated user found, redirecting to login");
    setLocation("/login");
    return null;
  }
  
  // If we have the Supabase auth but no backend user, we should stay on the current route
  // and wait for the user data to be created - it might take a moment
  if (hasSupabaseAuthOnly) {
    console.log("Has Supabase auth but waiting for backend user creation");
    return (
      <div className="flex h-screen items-center justify-center flex-col">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mb-4"></div>
        <p className="text-gray-500">Setting up your account...</p>
      </div>
    );
  }
  
  // Check if user has the required role to access this route
  if (user && !allowedRoles.includes(user.role)) {
    console.log(`User role ${user.role} not allowed for this route`);
    setLocation("/dashboard");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Settings Routes - Must be defined first */}
      <Route path="/settings">
        <ProtectedRoute allowedRoles={["admin", "designer", "sales"]}>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <AdminDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/login">
        <Login />
      </Route>
      
      <Route path="/clear-auth">
        <ClearAuth />
      </Route>
      
      {/* Client Portal Routes - No protection needed as they use their own token auth */}
      <Route path="/client-portal/login/:token?">
        <ClientPortalLogin />
      </Route>
      
      <Route path="/client-portal/:clientId">
        <ClientPortal />
      </Route>
      
      <Route path="/client-portal/:clientId/projects/:projectId">
        <ClientProjectDetail />
      </Route>
      
      <Route path="/client-portal/:clientId/proposals/:proposalId">
        <ClientProposalDetail />
      </Route>
      
      <Route path="/client-portal/:clientId/estimates/:estimateId">
        <ClientEstimateDetail />
      </Route>
      
      <Route path="/client-portal/:clientId/moodboards/:moodboardId">
        <ClientMoodboardDetail />
      </Route>
      
      {/* Admin/Designer/Sales Routes - Protected */}
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/crm">
        <ProtectedRoute allowedRoles={["admin", "designer", "sales"]}>
          <AppLayout>
            <CRM />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/proposals">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <AppLayout>
            <Proposals />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/proposal-editor">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <ProposalEditor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/proposal-editor/:id">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <ProposalEditor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/proposals/new/:leadId*">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <ProposalEditor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/moodboard">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <AppLayout>
            <Moodboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/moodboard/create">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <MoodboardEditor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/moodboard/edit/:id">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <MoodboardEditor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/estimates">
        <ProtectedRoute allowedRoles={["admin", "designer", "sales"]}>
          <AppLayout>
            <Estimates />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/estimates/create">
        <ProtectedRoute allowedRoles={["admin", "designer", "sales"]}>
          <AppLayout>
            <EstimateCreate />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/estimate/:leadId">
        <ProtectedRoute allowedRoles={["admin", "designer", "sales"]}>
          <AppLayout>
            <Estimate />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients">
        <ProtectedRoute allowedRoles={["admin", "designer", "sales"]}>
          <AppLayout>
            <Clients />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/project-tracker">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <AppLayout>
            <ProjectTracker />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/project-logs">
        <ProtectedRoute allowedRoles={["admin", "designer"]}>
          <AppLayout>
            <ProjectLogs />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Settings route moved to the top of the router */}
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SupabaseAuthProvider>
          <AuthProvider>
            <SidebarProvider>
              <Toaster />
              <Router />
            </SidebarProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
