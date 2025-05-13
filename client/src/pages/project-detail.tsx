import { useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, PlusCircle, Clock, User2, Calendar as CalendarIcon2, 
  ArrowLeft, Plus, Home, Edit, Trash2, CheckSquare, Camera, Info
} from 'lucide-react';

// Form schemas
const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
});

const taskFormSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  status: z.enum(["not_started", "in_progress", "delayed", "done"]),
  assignedTo: z.number().optional(),
});

const logFormSchema = z.object({
  text: z.string().min(1, "Log text is required"),
  roomId: z.number().nullable().optional(),
  photoUrl: z.string().optional(),
  photoCaption: z.string().optional(),
});

// Task status component
const TaskStatusBadge = ({ status }: { status: string }) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'not_started':
        return { text: 'Not Started', class: 'bg-gray-100 text-gray-800' };
      case 'in_progress':
        return { text: 'In Progress', class: 'bg-blue-100 text-blue-800' };
      case 'delayed':
        return { text: 'Delayed', class: 'bg-amber-100 text-amber-800' };
      case 'done':
        return { text: 'Done', class: 'bg-green-100 text-green-800' };
      default:
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    }
  };

  const badge = getStatusBadge();
  return <Badge className={badge.class}>{badge.text}</Badge>;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  
  // Dialog states
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [addLogDialogOpen, setAddLogDialogOpen] = useState(false);
  
  // Fetch project data
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id,
  });
  
  // Fetch users data for assigning tasks
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Calculate project details
  const rooms = Array.isArray(project?.rooms) ? project.rooms : [];
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  const logs = Array.isArray(project?.logs) ? project.logs : [];
  
  const roomTasks = selectedRoom 
    ? tasks.filter(task => task.roomId === selectedRoom) 
    : tasks;
  
  const roomLogs = selectedRoom 
    ? logs.filter(log => log.roomId === selectedRoom) 
    : logs;
  
  // Sort logs by date (newest first)
  const sortedLogs = [...roomLogs].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Task counts by status
  const taskCounts = {
    total: roomTasks.length,
    notStarted: roomTasks.filter(t => t.status === 'not_started').length,
    inProgress: roomTasks.filter(t => t.status === 'in_progress').length,
    delayed: roomTasks.filter(t => t.status === 'delayed').length,
    done: roomTasks.filter(t => t.status === 'done').length,
  };
  
  // Progress calculation
  const taskProgress = taskCounts.total > 0 
    ? Math.round((taskCounts.done / taskCounts.total) * 100) 
    : 0;
  
  // React Hook Form setup
  const roomForm = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "not_started",
    },
  });
  
  const logForm = useForm<z.infer<typeof logFormSchema>>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      text: "",
      roomId: selectedRoom,
    },
  });
  
  // Mutations
  const addRoomMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roomFormSchema>) => {
      return await fetch(`/api/projects/${id}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      setAddRoomDialogOpen(false);
      roomForm.reset();
      toast({
        title: "Success",
        description: "Room added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  const addTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof taskFormSchema>) => {
      return await fetch(`/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, roomId: selectedRoom }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      setAddTaskDialogOpen(false);
      taskForm.reset();
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number, status: string }) => {
      return await fetch(`/api/projects/${id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      toast({
        title: "Success",
        description: "Task status updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  const addLogMutation = useMutation({
    mutationFn: async (data: z.infer<typeof logFormSchema>) => {
      return await fetch(`/api/projects/${id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, roomId: selectedRoom }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      setAddLogDialogOpen(false);
      logForm.reset();
      toast({
        title: "Success",
        description: "Log added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add log",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Form submission handlers
  const onRoomSubmit = (values: z.infer<typeof roomFormSchema>) => {
    addRoomMutation.mutate(values);
  };
  
  const onTaskSubmit = (values: z.infer<typeof taskFormSchema>) => {
    addTaskMutation.mutate(values);
  };
  
  const onLogSubmit = (values: z.infer<typeof logFormSchema>) => {
    addLogMutation.mutate({ ...values, roomId: selectedRoom });
  };
  
  // Handle room selection
  const handleRoomSelect = (roomId: number | null) => {
    setSelectedRoom(roomId);
    logForm.setValue('roomId', roomId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="text-center py-20">
        <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
        <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => navigate('/project-tracker')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      {/* Back navigation and header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-2" 
          onClick={() => navigate('/project-tracker')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Home className="mr-1 h-4 w-4 text-gray-400" />
                {project.client?.name || "No client"}
              </span>
              {project.location && (
                <span className="flex items-center">
                  <Info className="mr-1 h-4 w-4 text-gray-400" />
                  {project.location}
                </span>
              )}
              {project.startDate && (
                <span className="flex items-center">
                  <CalendarIcon2 className="mr-1 h-4 w-4 text-gray-400" />
                  {new Date(project.startDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <Badge 
            className={cn(
              "ml-0 mt-2 md:mt-0 md:ml-2 capitalize self-start",
              project.status === "completed" && "bg-green-100 text-green-800",
              project.status === "in_progress" && "bg-blue-100 text-blue-800",
              project.status === "planning" && "bg-yellow-100 text-yellow-800",
              project.status === "on_hold" && "bg-gray-100 text-gray-800",
            )}
          >
            {project.status?.replace("_", " ") || "No status"}
          </Badge>
        </div>
        
        {project.description && (
          <p className="mt-3 text-gray-600">{project.description}</p>
        )}
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-500">Overall Progress</span>
            <span className="text-sm font-medium">{project.progress || 0}%</span>
          </div>
          <Progress value={project.progress || 0} className="h-2" />
        </div>
      </div>
      
      {/* Room selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant={selectedRoom === null ? "default" : "outline"} 
          size="sm"
          onClick={() => handleRoomSelect(null)}
        >
          All Rooms
        </Button>
        
        {rooms.map(room => (
          <Button 
            key={room.id}
            variant={selectedRoom === room.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoomSelect(room.id)}
          >
            {room.name}
          </Button>
        ))}
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setAddRoomDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Room
        </Button>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="logs">Daily Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taskCounts.total}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {taskCounts.done} completed, {taskCounts.total - taskCounts.done} remaining
                </p>
                <Progress value={taskProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rooms.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Track progress by room
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {logs.length > 0 ? `Last update: ${new Date(logs[0].createdAt).toLocaleDateString()}` : 'No logs yet'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium">Start</div>
                    <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}</div>
                  </div>
                  <div>
                    <div className="font-medium">End</div>
                    <div>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Rooms section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Rooms & Zones</CardTitle>
                  <Button size="sm" onClick={() => setAddRoomDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Room
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rooms.map(room => {
                      const roomTaskCount = tasks.filter(t => t.roomId === room.id).length;
                      const roomTasksDone = tasks.filter(t => t.roomId === room.id && t.status === 'done').length;
                      const roomProgress = roomTaskCount > 0 
                        ? Math.round((roomTasksDone / roomTaskCount) * 100) 
                        : 0;
                      
                      return (
                        <Card key={room.id} className="border shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{room.name}</h3>
                              <div className="flex">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {room.description && (
                              <p className="text-sm text-gray-500 mb-3">{room.description}</p>
                            )}
                            
                            <div className="space-y-2">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-gray-500">Progress</span>
                                <span className="text-xs font-medium">{roomProgress}%</span>
                              </div>
                              <Progress value={roomProgress} className="h-1.5" />
                              
                              <div className="flex justify-between text-xs text-gray-500 pt-1">
                                <span>{roomTasksDone}/{roomTaskCount} tasks completed</span>
                                <Button variant="ghost" size="sm" className="h-6 p-0 text-xs font-normal"
                                  onClick={() => {
                                    handleRoomSelect(room.id);
                                    setActiveTab("tasks");
                                  }}
                                >
                                  View Tasks
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Home className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-500 mb-1">No Rooms Added</h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Add rooms or zones to track progress for different areas
                    </p>
                    <Button size="sm" onClick={() => setAddRoomDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add First Room
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent logs section */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Recent Activity</CardTitle>
                <Button size="sm" onClick={() => {
                  setActiveTab("logs");
                  setAddLogDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Add Log
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedLogs.length > 0 ? (
                <div className="space-y-4">
                  {sortedLogs.slice(0, 5).map(log => {
                    const room = rooms.find(r => r.id === log.roomId);
                    return (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {log.photoUrl ? (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                              <img src={log.photoUrl} alt="Log" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                              <Info className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start">
                            <div>
                              <p className="text-sm text-gray-600">{log.text}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                {room && <span>• {room.name}</span>}
                                <span>• {log.createdBy?.name || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {sortedLogs.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="link" onClick={() => setActiveTab("logs")}>
                        View All Logs
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-500 mb-1">No Logs Yet</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Add daily logs with photos to track project progress
                  </p>
                  <Button size="sm" onClick={() => setAddLogDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add First Log
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Tasks {selectedRoom && `- ${rooms.find(r => r.id === selectedRoom)?.name}`}</CardTitle>
                <Button size="sm" onClick={() => setAddTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="rounded-full">
                  All ({taskCounts.total})
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Not Started ({taskCounts.notStarted})
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  In Progress ({taskCounts.inProgress})
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Delayed ({taskCounts.delayed})
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Done ({taskCounts.done})
                </Badge>
              </div>
              
              {roomTasks.length > 0 ? (
                <div className="space-y-4">
                  {roomTasks.map(task => {
                    const room = rooms.find(r => r.id === task.roomId);
                    const user = users.find(u => u.id === task.assignedTo);
                    
                    return (
                      <Card key={task.id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <Select 
                                  value={task.status}
                                  onValueChange={(value) => {
                                    updateTaskStatusMutation.mutate({ taskId: task.id, status: value });
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-6 p-0 border-0">
                                    <CheckSquare className={cn(
                                      "h-5 w-5",
                                      task.status === "done" && "text-green-500",
                                      task.status === "in_progress" && "text-blue-500",
                                      task.status === "delayed" && "text-amber-500",
                                      task.status === "not_started" && "text-gray-400",
                                    )} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_started">Not Started</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="delayed">Delayed</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{task.name}</h3>
                                {task.description && (
                                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <TaskStatusBadge status={task.status} />
                                  
                                  {room && (
                                    <Badge variant="outline" className="text-xs">
                                      {room.name}
                                    </Badge>
                                  )}
                                  
                                  {task.dueDate && (
                                    <div className="text-xs text-gray-500 flex items-center">
                                      <CalendarIcon2 className="h-3 w-3 mr-1" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  
                                  {user && (
                                    <div className="text-xs text-gray-500 flex items-center">
                                      <User2 className="h-3 w-3 mr-1" />
                                      {user.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-500 mb-1">No Tasks</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Add tasks to track work items for this {selectedRoom ? 'room' : 'project'}
                  </p>
                  <Button size="sm" onClick={() => setAddTaskDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Daily Logs {selectedRoom && `- ${rooms.find(r => r.id === selectedRoom)?.name}`}</CardTitle>
                <Button size="sm" onClick={() => setAddLogDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Log
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedLogs.length > 0 ? (
                <div className="space-y-6">
                  {sortedLogs.map(log => {
                    const room = rooms.find(r => r.id === log.roomId);
                    return (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {log.photoUrl ? (
                            <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                              <img src={log.photoUrl} alt="Log" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                              <Info className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{log.createdBy?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                                {room && (
                                  <Badge variant="outline" className="text-xs">
                                    {room.name}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700">{log.text}</p>
                              {log.photoCaption && (
                                <p className="text-sm text-gray-500 mt-1">{log.photoCaption}</p>
                              )}
                            </div>
                            
                            <div className="flex">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-500 mb-1">No Logs Yet</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Add daily logs with photos to track project progress
                  </p>
                  <Button size="sm" onClick={() => setAddLogDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add First Log
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Report Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Automatic Reports</h4>
                      <Select defaultValue="weekly">
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Client Email</h4>
                      <Input placeholder="client@example.com" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Report Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-photos" className="rounded" defaultChecked />
                        <label htmlFor="include-photos" className="text-sm">Include Photos</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-tasks" className="rounded" defaultChecked />
                        <label htmlFor="include-tasks" className="text-sm">Include Task Progress</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="include-logs" className="rounded" defaultChecked />
                        <label htmlFor="include-logs" className="text-sm">Include Daily Logs</label>
                      </div>
                    </div>
                    
                    <div>
                      <Button className="w-full">
                        Generate Report Now
                      </Button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Last report: {project.lastReportDate 
                          ? new Date(project.lastReportDate).toLocaleDateString() 
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Previous Reports</h3>
                  <div className="rounded-md border bg-gray-50 p-4 text-center">
                    <p className="text-sm text-gray-500">No reports generated yet</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Room Dialog */}
      <Dialog open={addRoomDialogOpen} onOpenChange={setAddRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room/Zone</DialogTitle>
          </DialogHeader>
          <Form {...roomForm}>
            <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-4">
              <FormField
                control={roomForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kitchen, Living Room, Bathroom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={roomForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add details about this room or zone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddRoomDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addRoomMutation.isPending}>
                  {addRoomMutation.isPending ? 'Adding...' : 'Add Room'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Task Dialog */}
      <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Install Cabinets" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add details about this task" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={taskForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={taskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span className="text-gray-400">Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={taskForm.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To (Optional)</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value?.toString()} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddTaskDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addTaskMutation.isPending}>
                  {addTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Log Dialog */}
      <Dialog open={addLogDialogOpen} onOpenChange={setAddLogDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Daily Log</DialogTitle>
          </DialogHeader>
          <Form {...logForm}>
            <form onSubmit={logForm.handleSubmit(onLogSubmit)} className="space-y-4">
              <FormField
                control={logForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What progress was made today?" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={logForm.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/photo.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={logForm.control}
                name="photoCaption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo Caption (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe the photo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddLogDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addLogMutation.isPending}>
                  {addLogMutation.isPending ? 'Adding...' : 'Add Log'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}