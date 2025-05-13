import React, { useState, useEffect } from "react";
import { useRoute, useRouter, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  Clock, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  MapPin, 
  MessageSquare,
  PieChart, 
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ClientProjectDetail() {
  const [_, params] = useRoute('/client-portal/:clientId/projects/:projectId');
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const projectId = params?.projectId ? parseInt(params.projectId) : 0;
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('clientPortalToken');
    if (!storedToken) {
      router[0]('/client-portal/login');
      return;
    }
    setToken(storedToken);
  }, []);
  
  // Fetch project
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
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      return apiRequest(`/api/client-portal/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: comment,
          roomId: selectedRoom
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the project",
      });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/projects', projectId] });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add your comment. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleAddComment = () => {
    if (!comment.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment before submitting",
        variant: "destructive"
      });
      return;
    }
    
    addCommentMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Project</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Project</h2>
          <p className="text-gray-500 mb-4">There was an error loading this project.</p>
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
  
  const { rooms = [], logs = [], tasks = [] } = project;
  
  // Get tasks for a specific room
  const getTasksForRoom = (roomId: number) => {
    return tasks.filter((task: any) => task.roomId === roomId);
  };
  
  // Get logs for a specific room
  const getLogsForRoom = (roomId: number) => {
    return logs.filter((log: any) => log.roomId === roomId);
  };
  
  // Format comments with newest first
  const comments = Array.isArray(project.comments) 
    ? [...project.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];
  
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
            <h1 className="text-2xl font-bold text-gray-900 ml-4">{project.name}</h1>
            <Badge variant={
              project.status === "completed" ? "success" : 
              project.status === "in_progress" ? "secondary" : "outline"
            } className="ml-4">
              {project.status}
            </Badge>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main project content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project overview */}
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  {project.description || "Interior design project details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Project progress */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium">Overall Progress</h3>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Project timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.startDate && (
                      <div className="border rounded-md p-3 flex items-center">
                        <div className="rounded-full bg-blue-100 p-2 mr-3">
                          <Calendar className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Start Date</p>
                          <p className="font-medium">{format(new Date(project.startDate), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    )}
                    
                    {project.estimatedCompletionDate && (
                      <div className="border rounded-md p-3 flex items-center">
                        <div className="rounded-full bg-amber-100 p-2 mr-3">
                          <Clock className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Estimated Completion</p>
                          <p className="font-medium">{format(new Date(project.estimatedCompletionDate), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    )}
                    
                    {project.location && (
                      <div className="border rounded-md p-3 flex items-center">
                        <div className="rounded-full bg-green-100 p-2 mr-3">
                          <MapPin className="h-5 w-5 text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{project.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional project details */}
                  {project.details && (
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Additional Details</h3>
                      <p className="text-gray-700">{project.details}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Rooms and zones */}
            <Card>
              <CardHeader>
                <CardTitle>Rooms & Zones</CardTitle>
                <CardDescription>
                  Track progress by room or zone
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rooms.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-4">
                    {rooms.map((room: any) => {
                      const roomTasks = getTasksForRoom(room.id);
                      const roomLogs = getLogsForRoom(room.id);
                      const completedTasks = roomTasks.filter((task: any) => task.status === 'completed').length;
                      const roomProgress = roomTasks.length > 0 
                        ? Math.round((completedTasks / roomTasks.length) * 100) 
                        : 0;
                        
                      return (
                        <AccordionItem key={room.id} value={`room-${room.id}`} className="border rounded-md px-4">
                          <AccordionTrigger className="hover:no-underline py-4">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center">
                                <div className="mr-4">
                                  <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-primary-50 text-primary-700">
                                    {room.type === 'kitchen' ? '🍳' : 
                                     room.type === 'bathroom' ? '🚿' : 
                                     room.type === 'bedroom' ? '🛏️' : 
                                     room.type === 'living' ? '🛋️' : '🏠'}
                                  </span>
                                </div>
                                <div className="text-left">
                                  <h3 className="font-medium">{room.name}</h3>
                                  <div className="flex items-center mt-1">
                                    <span className="text-sm text-gray-500 mr-2">{roomProgress}% complete</span>
                                    <span className="text-xs bg-gray-100 text-gray-800 rounded-full px-2 py-0.5">
                                      {roomTasks.length} tasks
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${roomProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                            {/* Room tasks */}
                            {roomTasks.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-medium text-sm mb-2">Tasks</h4>
                                <div className="space-y-2">
                                  {roomTasks.map((task: any) => (
                                    <div 
                                      key={task.id} 
                                      className="p-3 border rounded-md flex items-center justify-between"
                                    >
                                      <div className="flex items-center">
                                        <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-3 ${
                                          task.status === 'completed' ? 'bg-green-100 text-green-600' :
                                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                          task.status === 'delayed' ? 'bg-red-100 text-red-600' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                          {task.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                                          {task.status === 'in_progress' && <Clock className="h-3 w-3" />}
                                        </div>
                                        <span className="text-sm">{task.name}</span>
                                      </div>
                                      <Badge variant={
                                        task.status === 'completed' ? 'success' :
                                        task.status === 'in_progress' ? 'secondary' :
                                        task.status === 'delayed' ? 'destructive' :
                                        'outline'
                                      } className="text-xs">
                                        {task.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Recent updates */}
                            {roomLogs.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Recent Updates</h4>
                                <div className="space-y-3">
                                  {roomLogs.slice(0, 3).map((log: any, index: number) => (
                                    <div key={index} className="border rounded-md p-3">
                                      <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm">{log.note}</p>
                                        <span className="text-xs text-gray-500">
                                          {log.date ? format(new Date(log.date), 'MMM d, yyyy') : ''}
                                        </span>
                                      </div>
                                      {log.imageUrl && (
                                        <div className="mt-2 rounded-md overflow-hidden border">
                                          <img 
                                            src={log.imageUrl} 
                                            alt="Progress update" 
                                            className="w-full h-32 object-cover"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Comments section for each room */}
                            <div className="mt-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedRoom(room.id)}
                                className="w-full"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add comment for this room
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-50 rounded-md p-6 inline-block">
                      <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No rooms have been defined for this project yet.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Comments section */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Comments
                  </div>
                </CardTitle>
                <CardDescription>
                  {comments.length > 0 
                    ? `${comments.length} comment${comments.length === 1 ? '' : 's'} on this project`
                    : 'Share your thoughts about this project'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    {rooms.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">Comment on (optional)</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            variant={selectedRoom === null ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedRoom(null)}
                          >
                            General
                          </Badge>
                          {rooms.map((room: any) => (
                            <Badge 
                              key={room.id}
                              variant={selectedRoom === room.id ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setSelectedRoom(room.id)}
                            >
                              {room.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Textarea
                      placeholder="Add your comments, questions, or feedback about the project..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button 
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending || !comment.trim()}
                  >
                    {addCommentMutation.isPending ? "Submitting..." : "Add Comment"}
                  </Button>
                </div>
                
                {comments.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <Separator />
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {comment.createdBy?.name || 'Anonymous'}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="ml-2"
                            >
                              {comment.createdBy?.type === 'client' ? 'You' : 'Design Team'}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </span>
                        </div>
                        
                        {comment.roomId && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {rooms.find((r: any) => r.id === comment.roomId)?.name || `Room ${comment.roomId}`}
                            </Badge>
                          </div>
                        )}
                        
                        <p className="mt-2">{comment.text}</p>
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project status */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{project.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="font-medium">{project.progress}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Started</p>
                    <p className="font-medium">
                      {project.startDate ? format(new Date(project.startDate), 'PP') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Est. Completion</p>
                    <p className="font-medium">
                      {project.estimatedCompletionDate 
                        ? format(new Date(project.estimatedCompletionDate), 'PP') 
                        : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Task Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-gray-500">Total Tasks</p>
                      <p className="font-medium">{tasks.length}</p>
                    </div>
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="font-medium">{tasks.filter((t: any) => t.status === 'completed').length}</p>
                    </div>
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-gray-500">In Progress</p>
                      <p className="font-medium">{tasks.filter((t: any) => t.status === 'in_progress').length}</p>
                    </div>
                    <div className="border rounded-md p-2 text-center">
                      <p className="text-xs text-gray-500">Not Started</p>
                      <p className="font-medium">{tasks.filter((t: any) => t.status === 'not_started').length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Photos */}
            {logs.some((log: any) => log.imageUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {logs
                      .filter((log: any) => log.imageUrl)
                      .slice(0, 4)
                      .map((log: any, index: number) => (
                        <div key={index} className="border rounded-md overflow-hidden">
                          <img 
                            src={log.imageUrl} 
                            alt={`Update on ${log.date ? format(new Date(log.date), 'PP') : 'unknown date'}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="p-1 text-center">
                            <p className="text-xs text-gray-500">
                              {log.date ? format(new Date(log.date), 'MM/dd/yyyy') : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Documents */}
            {project.documents && project.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.documents.map((doc: any, index: number) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Download className="h-4 w-4 text-gray-500" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Project Team */}
            {project.team && project.team.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.team.map((member: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="h-8 w-8 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">
                              {member.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}