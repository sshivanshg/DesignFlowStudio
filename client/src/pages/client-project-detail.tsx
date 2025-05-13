import React, { useState, useEffect } from "react";
import { useRoute, useRouter, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MessageSquare,
  ArrowLeft,
  Calendar,
  Home,
  ClipboardList,
  Image as ImageIcon,
  AlertTriangle,
  Clock4
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

// Task status badge component
const TaskStatusBadge = ({ status }: { status: string }) => {
  const getVariant = () => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in_progress':
        return 'default';
      case 'delayed':
        return 'destructive';
      case 'not_started':
      default:
        return 'secondary';
    }
  };
  
  const getLabel = () => {
    switch (status) {
      case 'done':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'delayed':
        return 'Delayed';
      case 'not_started':
      default:
        return 'Not Started';
    }
  };
  
  return (
    <Badge variant={getVariant() as any}>
      {getLabel()}
    </Badge>
  );
};

// Client project details page
export default function ClientProjectDetail() {
  const [_, params] = useRoute('/client-portal/:clientId/projects/:projectId');
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const projectId = params?.projectId ? parseInt(params.projectId) : 0;
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
  
  // Fetch project details
  const { 
    data: project, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/client-portal/projects', projectId],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest(`/api/client-portal/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token && !!projectId
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Project Details</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Project</h2>
          <p className="text-gray-500 mb-4">There was an error loading your project details.</p>
          <Link href={`/client-portal/${clientId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or you don't have access.</p>
          <Link href={`/client-portal/${clientId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Extract project details
  const {
    name,
    description,
    location,
    status,
    startDate,
    endDate,
    budget,
    progress,
    rooms = [],
    tasks = [],
    logs = [],
    photos = []
  } = project;
  
  // Organize tasks by room
  const tasksByRoom: Record<string, any[]> = {};
  
  // Add "General" category for tasks without a room
  tasksByRoom['general'] = [];
  
  // Group tasks by room ID
  tasks.forEach((task: any) => {
    const roomId = task.roomId;
    if (roomId === null) {
      tasksByRoom['general'].push(task);
    } else {
      if (!tasksByRoom[roomId]) {
        tasksByRoom[roomId] = [];
      }
      tasksByRoom[roomId].push(task);
    }
  });
  
  // Get room name from room ID
  const getRoomName = (roomId: number | null) => {
    if (roomId === null) return 'General';
    const room = rooms.find((r: any) => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };
  
  // Get the latest logs (max 10)
  const latestLogs = logs.slice(0, 10);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href={`/client-portal/${clientId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">{name}</h1>
            <Badge variant={
              status === "completed" ? "success" : 
              status === "in_progress" ? "default" :
              status === "planning" ? "secondary" : "outline"
            } className="ml-4">
              {status}
            </Badge>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Project overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>{description || 'No description provided.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p>{location || 'Not specified'}</p>
              </div>
              {startDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                  <p>{format(new Date(startDate), 'PPP')}</p>
                </div>
              )}
              {endDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                  <p>{format(new Date(endDate), 'PPP')}</p>
                </div>
              )}
              {budget && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                  <p>${budget.toLocaleString()}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress || 0}%</span>
              </div>
              <Progress value={progress || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        {/* Project details tabs */}
        <Tabs defaultValue="progress">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="progress">
              <BarChart3 className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ClipboardList className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="updates">
              <Clock className="h-4 w-4 mr-2" />
              Updates
            </TabsTrigger>
          </TabsList>
          
          {/* Progress tab - show rooms */}
          <TabsContent value="progress">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card for each room */}
              {rooms.length > 0 ? (
                rooms.map((room: any) => {
                  // Calculate room progress based on tasks in this room
                  const roomTasks = tasks.filter((t: any) => t.roomId === room.id);
                  let roomProgress = 0;
                  if (roomTasks.length > 0) {
                    const completedTasks = roomTasks.filter((t: any) => t.status === 'done').length;
                    roomProgress = Math.round((completedTasks / roomTasks.length) * 100);
                  }
                  
                  return (
                    <Card key={room.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle>{room.name}</CardTitle>
                        <CardDescription>{room.description || 'No description available'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{roomProgress}%</span>
                          </div>
                          <Progress value={roomProgress} className="h-2" />
                        </div>
                        
                        {/* Task summary for this room */}
                        <div className="mt-4 text-sm">
                          <h4 className="font-medium">Tasks</h4>
                          <ul className="mt-2 space-y-1">
                            {roomTasks.length > 0 ? (
                              roomTasks.map((task: any) => (
                                <li key={task.id} className="flex justify-between">
                                  <span className="truncate">{task.name}</span>
                                  <TaskStatusBadge status={task.status} />
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-500">No tasks for this room yet</li>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8">
                  <Home className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">No rooms have been added to this project yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tasks tab - list all tasks */}
          <TabsContent value="tasks">
            <div className="space-y-6">
              {Object.keys(tasksByRoom).map(roomId => {
                const roomTasks = tasksByRoom[roomId];
                
                if (roomTasks.length === 0) return null;
                
                const roomName = roomId === 'general' ? 'General Tasks' : getRoomName(parseInt(roomId));
                
                return (
                  <div key={roomId} className="space-y-2">
                    <h3 className="text-lg font-semibold">{roomName}</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <ul className="divide-y">
                          {roomTasks.map((task: any) => (
                            <li key={task.id} className="py-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{task.name}</h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-500">{task.description}</p>
                                  )}
                                </div>
                                <TaskStatusBadge status={task.status} />
                              </div>
                              
                              {/* Task details */}
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                {task.dueDate && (
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                                    <span>Due: {format(new Date(task.dueDate), 'PP')}</span>
                                  </div>
                                )}
                                {task.assignedTo && (
                                  <div className="flex items-center">
                                    <span>Assigned to: {task.assignedTo.name || 'Unknown'}</span>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
              
              {Object.values(tasksByRoom).flat().length === 0 && (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500">No tasks have been added to this project yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Updates tab - show logs and photos */}
          <TabsContent value="updates">
            <div className="space-y-6">
              {/* Latest activity logs */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Updates</h3>
                
                {latestLogs.length > 0 ? (
                  <div className="space-y-4">
                    {latestLogs.map((log: any) => (
                      <Card key={log.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start">
                            {log.photoUrl ? (
                              <ImageIcon className="h-5 w-5 text-blue-500 mt-1 mr-3" />
                            ) : (
                              <MessageSquare className="h-5 w-5 text-gray-500 mt-1 mr-3" />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="text-sm font-medium">
                                  {log.createdBy?.name || 'Team Member'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(log.createdAt), 'PPp')}
                                </p>
                              </div>
                              <p className="mt-1">{log.text}</p>
                              
                              {/* Show room if available */}
                              {log.roomId !== null && (
                                <Badge variant="outline" className="mt-2">
                                  {getRoomName(log.roomId)}
                                </Badge>
                              )}
                              
                              {/* Show photo if available */}
                              {log.photoUrl && (
                                <div className="mt-3">
                                  <img 
                                    src={log.photoUrl} 
                                    alt={log.photoCaption || "Project photo"} 
                                    className="rounded-md max-h-60 object-cover"
                                  />
                                  {log.photoCaption && (
                                    <p className="text-sm text-gray-500 mt-1">{log.photoCaption}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock4 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-500">No updates have been posted yet.</p>
                  </div>
                )}
              </div>
              
              {/* Photo gallery section */}
              {photos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Photo Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo: any) => (
                      <div key={photo.id} className="group relative">
                        <img 
                          src={photo.url} 
                          alt={photo.caption || "Project photo"} 
                          className="h-40 w-full object-cover rounded-md shadow-sm"
                        />
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                            {photo.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}