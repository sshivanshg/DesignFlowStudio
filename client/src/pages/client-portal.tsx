import React, { useState, useEffect } from "react";
import { useRoute, useRouter, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertCircle, 
  Check, 
  CheckCircle,
  Clock,
  FileText,
  LogOut, 
  MoreHorizontal, 
  Palette, 
  PieChart, 
  Presentation,
  UserIcon
} from "lucide-react";

export default function ClientPortal() {
  const [_, params] = useRoute("/client-portal/:clientId");
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('clientPortalToken');
    if (!storedToken) {
      router[0]('/client-portal/login');
      return;
    }
    setToken(storedToken);
  }, []);
  
  // Fetch client profile
  const { 
    data: client, 
    isLoading: isLoadingClient, 
    error: clientError 
  } = useQuery({
    queryKey: ['/api/client-portal/profile'],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest('/api/client-portal/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token
  });
  
  // Fetch client's projects
  const { 
    data: projects,
    isLoading: isLoadingProjects
  } = useQuery({
    queryKey: ['/api/client-portal/projects'],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest('/api/client-portal/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token
  });
  
  // Fetch client's proposals
  const { 
    data: proposals,
    isLoading: isLoadingProposals
  } = useQuery({
    queryKey: ['/api/client-portal/proposals'],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest('/api/client-portal/proposals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token
  });
  
  // Fetch client's estimates
  const { 
    data: estimates,
    isLoading: isLoadingEstimates
  } = useQuery({
    queryKey: ['/api/client-portal/estimates'],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest('/api/client-portal/estimates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token
  });
  
  // Fetch client's moodboards
  const { 
    data: moodboards,
    isLoading: isLoadingMoodboards
  } = useQuery({
    queryKey: ['/api/client-portal/moodboards'],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest('/api/client-portal/moodboards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token
  });
  
  const handleLogout = () => {
    localStorage.removeItem('clientPortalToken');
    router[0]('/client-portal/login');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out of your account",
    });
  };
  
  if (isLoadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Portal</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }
  
  if (clientError || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Error</h2>
          <p className="text-gray-500 mb-4">Unable to access your portal. Your session may have expired.</p>
          <Button onClick={() => router[0]('/client-portal/login')}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Client Portal</h1>
            <div className="flex items-center">
              <div className="mr-4 text-right hidden md:block">
                <div className="text-sm font-medium">{client.name}</div>
                <div className="text-xs text-gray-500">{client.email}</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="font-medium md:hidden">
                    {client.name}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-500 md:hidden">
                    {client.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <Card className="col-span-1 md:col-span-3">
                <CardHeader>
                  <CardTitle>Welcome, {client.name}</CardTitle>
                  <CardDescription>
                    Here's an overview of your project with us
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-md p-4 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Presentation className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Proposals</p>
                        <p className="text-2xl font-bold">{proposals?.length || 0}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-4 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimates</p>
                        <p className="text-2xl font-bold">{estimates?.length || 0}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-4 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <Palette className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Moodboards</p>
                        <p className="text-2xl font-bold">{moodboards?.length || 0}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-md p-4 flex items-center">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                        <PieChart className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Projects</p>
                        <p className="text-2xl font-bold">{projects?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <div className="col-span-1 md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Projects</CardTitle>
                    <CardDescription>
                      Your ongoing design projects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingProjects ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading projects...</p>
                      </div>
                    ) : projects && projects.length > 0 ? (
                      <div className="space-y-4">
                        {projects.map((project: any) => (
                          <div key={project.id} className="border rounded-md p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{project.name}</h3>
                                {project.description && (
                                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                                )}
                              </div>
                              <div className="flex items-center">
                                {project.status && (
                                  <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-2 py-1 mr-2">
                                    {project.status}
                                  </span>
                                )}
                                <Link href={`/client-portal/${clientId}/projects/${project.id}`}>
                                  <Button size="sm">View Details</Button>
                                </Link>
                              </div>
                            </div>
                            {project.progress !== null && (
                              <div className="mt-4">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Progress</span>
                                  <span>{project.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full" 
                                    style={{ width: `${project.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No active projects found</p>
                      </div>
                    )}
                  </CardContent>
                  {projects && projects.length > 3 && (
                    <CardFooter>
                      <Button variant="ghost" className="w-full" asChild>
                        <Link href="?tab=projects">View All Projects</Link>
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Moodboards</CardTitle>
                    <CardDescription>
                      Design concepts and inspiration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMoodboards ? (
                      <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading moodboards...</p>
                      </div>
                    ) : moodboards && moodboards.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {moodboards.slice(0, 4).map((moodboard: any) => (
                          <div key={moodboard.id} className="border rounded-md overflow-hidden">
                            {moodboard.coverImage ? (
                              <div className="h-32 bg-gray-200 relative">
                                <img 
                                  src={moodboard.coverImage} 
                                  alt={moodboard.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-32 bg-gray-100 flex items-center justify-center">
                                <Palette className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="p-3">
                              <h3 className="font-medium text-sm">{moodboard.name}</h3>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {moodboard.createdAt ? format(new Date(moodboard.createdAt), 'MMM d, yyyy') : ''}
                                </span>
                                <Link href={`/client-portal/${clientId}/moodboards/${moodboard.id}`}>
                                  <Button size="sm" variant="ghost" className="h-8 text-xs">View</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No moodboards available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="col-span-1 space-y-6">
                {/* Proposals Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Proposals</CardTitle>
                    <CardDescription>
                      Review and approve design proposals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingProposals ? (
                      <div className="text-center py-4">
                        <div className="animate-spin h-6 w-6 border-4 border-primary rounded-full border-t-transparent mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading...</p>
                      </div>
                    ) : proposals && proposals.length > 0 ? (
                      <div className="space-y-3">
                        {proposals.slice(0, 5).map((proposal: any) => (
                          <div key={proposal.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div>
                              <h3 className="font-medium text-sm">{proposal.title}</h3>
                              <div className="flex items-center mt-1">
                                {proposal.clientApproved ? (
                                  <div className="flex items-center text-green-600 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    <span>Approved</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-amber-600 text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>Pending approval</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Link href={`/client-portal/${clientId}/proposals/${proposal.id}`}>
                              <Button size="sm" variant="ghost">View</Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No proposals available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Estimates Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estimates</CardTitle>
                    <CardDescription>
                      Project cost estimates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingEstimates ? (
                      <div className="text-center py-4">
                        <div className="animate-spin h-6 w-6 border-4 border-primary rounded-full border-t-transparent mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading...</p>
                      </div>
                    ) : estimates && estimates.length > 0 ? (
                      <div className="space-y-3">
                        {estimates.slice(0, 5).map((estimate: any) => (
                          <div key={estimate.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div>
                              <h3 className="font-medium text-sm">{estimate.title}</h3>
                              {estimate.total && (
                                <p className="text-sm text-gray-500 mt-1">
                                  ${Number(estimate.total).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <Link href={`/client-portal/${clientId}/estimates/${estimate.id}`}>
                              <Button size="sm" variant="ghost">View</Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-500">No estimates available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>
                  Track the progress of your design projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProjects ? (
                  <div className="text-center py-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading projects...</p>
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-6">
                    {projects.map((project: any) => (
                      <div key={project.id} className="border rounded-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium">{project.name}</h3>
                              {project.description && (
                                <p className="text-gray-500 mt-1">{project.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
                              {project.status && (
                                <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1">
                                  {project.status}
                                </span>
                              )}
                              <Link href={`/client-portal/${clientId}/projects/${project.id}`}>
                                <Button>View Details</Button>
                              </Link>
                            </div>
                          </div>
                          
                          {project.progress !== null && (
                            <div className="mt-6">
                              <div className="flex justify-between text-sm mb-2">
                                <span>Overall Progress</span>
                                <span className="font-medium">{project.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {project.startDate && (
                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                              <div>
                                <span className="font-medium">Started:</span> {format(new Date(project.startDate), 'MMM d, yyyy')}
                              </div>
                              {project.estimatedCompletionDate && (
                                <div>
                                  <span className="font-medium">Est. Completion:</span> {format(new Date(project.estimatedCompletionDate), 'MMM d, yyyy')}
                                </div>
                              )}
                              {project.location && (
                                <div>
                                  <span className="font-medium">Location:</span> {project.location}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Recent Updates */}
                        {project.recentUpdates && project.recentUpdates.length > 0 && (
                          <div className="border-t bg-gray-50 p-4">
                            <h4 className="text-sm font-medium mb-2">Recent Updates</h4>
                            <div className="space-y-2">
                              {project.recentUpdates.slice(0, 2).map((update: any, index: number) => (
                                <div key={index} className="flex items-start">
                                  <div className="min-w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
                                    <Check className="h-3 w-3 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm">{update.note}</p>
                                    {update.date && (
                                      <p className="text-xs text-gray-500">{format(new Date(update.date), 'MMM d, yyyy')}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <PieChart className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Projects</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      There are no active projects in your account yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Proposals */}
              <Card>
                <CardHeader>
                  <CardTitle>Proposals</CardTitle>
                  <CardDescription>
                    Review and approve design proposals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProposals ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading proposals...</p>
                    </div>
                  ) : proposals && proposals.length > 0 ? (
                    <div className="space-y-4">
                      {proposals.map((proposal: any) => (
                        <div key={proposal.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{proposal.title}</h3>
                              {proposal.createdAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {format(new Date(proposal.createdAt), 'MMMM d, yyyy')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center">
                              {proposal.clientApproved ? (
                                <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1 flex items-center mr-2">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </span>
                              ) : (
                                <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-1 flex items-center mr-2">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </span>
                              )}
                              <Link href={`/client-portal/${clientId}/proposals/${proposal.id}`}>
                                <Button size="sm">View</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No proposals available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Estimates */}
              <Card>
                <CardHeader>
                  <CardTitle>Estimates</CardTitle>
                  <CardDescription>
                    Review project cost estimates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEstimates ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading estimates...</p>
                    </div>
                  ) : estimates && estimates.length > 0 ? (
                    <div className="space-y-4">
                      {estimates.map((estimate: any) => (
                        <div key={estimate.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{estimate.title}</h3>
                              <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                                {estimate.total && (
                                  <p className="text-gray-700 font-medium">
                                    ${Number(estimate.total).toLocaleString()}
                                  </p>
                                )}
                                {estimate.createdAt && (
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(estimate.createdAt), 'MMMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Link href={`/client-portal/${clientId}/estimates/${estimate.id}`}>
                              <Button size="sm">View</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No estimates available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Moodboards */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Moodboards</CardTitle>
                  <CardDescription>
                    Design concepts and visual inspirations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMoodboards ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading moodboards...</p>
                    </div>
                  ) : moodboards && moodboards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {moodboards.map((moodboard: any) => (
                        <div key={moodboard.id} className="border rounded-md overflow-hidden group">
                          <div className="h-40 bg-gray-100 relative">
                            {moodboard.coverImage ? (
                              <img 
                                src={moodboard.coverImage} 
                                alt={moodboard.name} 
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Palette className="h-10 w-10 text-gray-300" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{moodboard.name}</h3>
                                {moodboard.theme && (
                                  <p className="text-xs text-gray-500 mt-1">{moodboard.theme}</p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/client-portal/${clientId}/moodboards/${moodboard.id}`}>
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  {moodboard.pdfURL && (
                                    <DropdownMenuItem asChild>
                                      <a href={moodboard.pdfURL} target="_blank" rel="noopener noreferrer">
                                        Download PDF
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="mt-4">
                              <Link href={`/client-portal/${clientId}/moodboards/${moodboard.id}`}>
                                <Button variant="outline" size="sm" className="w-full">View Moodboard</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No moodboards available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}