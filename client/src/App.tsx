import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";

import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CRM from "@/pages/crm";
import Proposals from "@/pages/proposals";
import ProposalEditor from "@/pages/proposal-editor";
import Moodboard from "@/pages/moodboard";
import Estimates from "@/pages/estimates";
import Clients from "@/pages/clients";
import Settings from "@/pages/settings";

import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ 
  children, 
  allowedRoles = ["admin", "designer", "sales"] 
}: { 
  children: React.ReactNode; 
  allowedRoles?: Array<"admin" | "designer" | "sales">;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }
  
  // Check if user has the required role to access this route
  if (!allowedRoles.includes(user.role)) {
    window.location.href = "/dashboard";
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      
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
        <ProtectedRoute allowedRoles={["admin", "sales"]}>
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
      
      <Route path="/estimates">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <Estimates />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients">
        <ProtectedRoute allowedRoles={["admin", "sales"]}>
          <AppLayout>
            <Clients />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
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
        <AuthProvider>
          <SidebarProvider>
            <Toaster />
            <Router />
          </SidebarProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
