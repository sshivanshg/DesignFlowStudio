import React, { useState, useEffect } from "react";
import { useRoute, useRouter } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Calculator, 
  Palette, 
  BarChart3, 
  MessageSquare,
  User,
  LogOut,
  Clock,
  CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

// Client AuthGuard
function useClientAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('clientPortalToken');
      const clientInfo = localStorage.getItem('clientInfo');
      
      if (!token || !clientInfo) {
        router[0]('/client-portal/login');
        setIsLoading(false);
        return;
      }
      
      try {
        // Verify token is valid by fetching client info
        await apiRequest('/api/client-portal/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Authentication error:", error);
        localStorage.removeItem('clientPortalToken');
        localStorage.removeItem('clientInfo');
        router[0]('/client-portal/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  return { isAuthenticated, isLoading };
}

// Client Dashboard Tabs
const ProposalsTab = ({ clientId }: { clientId: number }) => {
  const { toast } = useToast();
  const router = useRouter();
  
  const { data: proposals, isLoading, error } = useQuery({
    queryKey: ['/api/client-portal/proposals'],
    queryFn: async () => {
      const token = localStorage.getItem('clientPortalToken');
      return apiRequest('/api/client-portal/proposals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
  });
  
  if (isLoading) return <div className="py-8 text-center">Loading proposals...</div>;
  if (error) return <div className="py-8 text-center text-red-500">Error loading proposals</div>;
  
  if (!proposals || proposals.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <FileText className="mx-auto h-12 w-12 mb-2 opacity-20" />
        <p>You don't have any proposals yet.</p>
      </div>
    );
  }
  
  const handleViewProposal = (id: number) => {
    router[0](`/client-portal/${clientId}/proposals/${id}`);
  };
  
  return (
    <div className="space-y-4">
      {proposals.map((proposal: any) => (
        <Card key={proposal.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{proposal.title}</CardTitle>
                <CardDescription>
                  Created {proposal.createdAt ? format(new Date(proposal.createdAt), 'PPP') : 'Recently'}
                </CardDescription>
              </div>
              <Badge variant={proposal.clientApproved ? "success" : 
                      proposal.status === "draft" ? "secondary" : "outline"}>
                {proposal.clientApproved ? "Approved" : proposal.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mt-2">
              <Button 
                variant="default" 
                onClick={() => handleViewProposal(proposal.id)}
              >
                View Proposal
              </Button>
              {proposal.viewedAt && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Viewed on {format(new Date(proposal.viewedAt), 'PPP')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const EstimatesTab = ({ clientId }: { clientId: number }) => {
  const router = useRouter();
  
  const { data: estimates, isLoading, error } = useQuery({
    queryKey: ['/api/client-portal/estimates'],
    queryFn: async () => {
      const token = localStorage.getItem('clientPortalToken');
      return apiRequest('/api/client-portal/estimates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
  });
  
  if (isLoading) return <div className="py-8 text-center">Loading estimates...</div>;
  if (error) return <div className="py-8 text-center text-red-500">Error loading estimates</div>;
  
  if (!estimates || estimates.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Calculator className="mx-auto h-12 w-12 mb-2 opacity-20" />
        <p>You don't have any estimates yet.</p>
      </div>
    );
  }
  
  const handleViewEstimate = (id: number) => {
    router[0](`/client-portal/${clientId}/estimates/${id}`);
  };
  
  return (
    <div className="space-y-4">
      {estimates.map((estimate: any) => (
        <Card key={estimate.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{estimate.title}</CardTitle>
                <CardDescription>
                  Created {estimate.createdAt ? format(new Date(estimate.createdAt), 'PPP') : 'Recently'}
                </CardDescription>
              </div>
              <Badge variant={estimate.status === "approved" ? "success" : 
                      estimate.status === "draft" ? "secondary" : "outline"}>
                {estimate.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium">${estimate.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST:</span>
                <span className="font-medium">${estimate.gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-medium">Total:</span>
                <span className="font-bold">${estimate.total.toLocaleString()}</span>
              </div>
              <Button 
                variant="default" 
                onClick={() => handleViewEstimate(estimate.id)}
                className="mt-4"
              >
                View Estimate
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const MoodboardsTab = ({ clientId }: { clientId: number }) => {
  const router = useRouter();
  
  const { data: moodboards, isLoading, error } = useQuery({
    queryKey: ['/api/client-portal/moodboards'],
    queryFn: async () => {
      const token = localStorage.getItem('clientPortalToken');
      return apiRequest('/api/client-portal/moodboards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
  });
  
  if (isLoading) return <div className="py-8 text-center">Loading moodboards...</div>;
  if (error) return <div className="py-8 text-center text-red-500">Error loading moodboards</div>;
  
  if (!moodboards || moodboards.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <Palette className="mx-auto h-12 w-12 mb-2 opacity-20" />
        <p>You don't have any moodboards yet.</p>
      </div>
    );
  }
  
  const handleViewMoodboard = (id: number) => {
    router[0](`/client-portal/${clientId}/moodboards/${id}`);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {moodboards.map((moodboard: any) => (
        <Card key={moodboard.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>{moodboard.name}</CardTitle>
            <CardDescription>
              {moodboard.description || 'Design inspiration for your project'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mt-2">
              <Button 
                variant="default" 
                onClick={() => handleViewMoodboard(moodboard.id)}
              >
                View Moodboard
              </Button>
              {moodboard.theme && (
                <Badge variant="outline" className="ml-2">
                  {moodboard.theme}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const ProjectsTab = ({ clientId }: { clientId: number }) => {
  const router = useRouter();
  
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['/api/client-portal/projects'],
    queryFn: async () => {
      const token = localStorage.getItem('clientPortalToken');
      return apiRequest('/api/client-portal/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
  });
  
  if (isLoading) return <div className="py-8 text-center">Loading projects...</div>;
  if (error) return <div className="py-8 text-center text-red-500">Error loading projects</div>;
  
  if (!projects || projects.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <BarChart3 className="mx-auto h-12 w-12 mb-2 opacity-20" />
        <p>You don't have any active projects yet.</p>
      </div>
    );
  }
  
  const handleViewProject = (id: number) => {
    router[0](`/client-portal/${clientId}/projects/${id}`);
  };
  
  return (
    <div className="space-y-4">
      {projects.map((project: any) => (
        <Card key={project.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                  {project.location || 'Project location not specified'}
                </CardDescription>
              </div>
              <Badge variant={
                project.status === "completed" ? "success" : 
                project.status === "in_progress" ? "default" :
                project.status === "planning" ? "secondary" : "outline"
              }>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress || 0}%</span>
                </div>
                <Progress value={project.progress || 0} className="h-2" />
              </div>
              
              {/* Project details summary */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {project.startDate && (
                  <div>
                    <span className="text-gray-500 block">Start Date:</span>
                    <span>{format(new Date(project.startDate), 'PP')}</span>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <span className="text-gray-500 block">End Date:</span>
                    <span>{format(new Date(project.endDate), 'PP')}</span>
                  </div>
                )}
              </div>
              
              {/* Room count summary */}
              {Array.isArray(project.rooms) && project.rooms.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500 block">Rooms:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {project.rooms.map((room: any) => (
                      <Badge key={room.id} variant="outline">
                        {room.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent logs */}
              {Array.isArray(project.logs) && project.logs.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Latest Update:</span>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <span className="text-xs text-gray-500">
                      {format(new Date(project.logs[0].createdAt), 'PPp')}
                    </span>
                    <p className="line-clamp-2">{project.logs[0].text}</p>
                  </div>
                </div>
              )}
              
              <Button 
                variant="default" 
                onClick={() => handleViewProject(project.id)}
                className="w-full"
              >
                View Project Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function ClientPortal() {
  const [_, params] = useRoute('/client-portal/:clientId');
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useClientAuth();
  const [clientInfo, setClientInfo] = useState<any>(null);
  
  useEffect(() => {
    // Get client info from localStorage
    const storedClientInfo = localStorage.getItem('clientInfo');
    if (storedClientInfo) {
      try {
        setClientInfo(JSON.parse(storedClientInfo));
      } catch (e) {
        console.error("Error parsing client info:", e);
      }
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('clientPortalToken');
    localStorage.removeItem('clientInfo');
    router[0]('/client-portal/login');
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Client Portal</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // AuthGuard will redirect to login
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
              {clientInfo && (
                <Badge variant="outline" className="ml-4">
                  {clientInfo.name}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-[600px] w-full">
            <TabsTrigger value="projects">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="proposals">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="estimates">
              <Calculator className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Estimates</span>
            </TabsTrigger>
            <TabsTrigger value="moodboards">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Moodboards</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Projects</h2>
            </div>
            <ProjectsTab clientId={clientId} />
          </TabsContent>
          
          <TabsContent value="proposals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Proposals</h2>
            </div>
            <ProposalsTab clientId={clientId} />
          </TabsContent>
          
          <TabsContent value="estimates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Estimates</h2>
            </div>
            <EstimatesTab clientId={clientId} />
          </TabsContent>
          
          <TabsContent value="moodboards" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Moodboards</h2>
            </div>
            <MoodboardsTab clientId={clientId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}