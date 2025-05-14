import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format, parseISO, subDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Calendar,
  CalendarIcon,
  Clipboard, 
  ClipboardList,
  Clock, 
  CheckCircle,
  Download,
  FileTextIcon, 
  Eye,
  ImageIcon,
  Info,
  Layers,
  LineChart,
  List, 
  MessageSquare,
  MapPin, 
  Pencil,
  Plus, 
  RefreshCw,
  Search,
  Trash2,
  AlertTriangle,
  Upload,
  ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Form validation schemas
const logEntrySchema = z.object({
  text: z.string().min(5, { message: "Log entry must be at least 5 characters" }),
  roomId: z.string().optional(),
  photoUrl: z.string().optional(),
  photoCaption: z.string().optional(),
  type: z.enum(["note", "photo"]),
});

const reportSchema = z.object({
  reportType: z.enum(["weekly", "monthly", "custom"]),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  includePhotos: z.boolean().default(true),
  includeNotes: z.boolean().default(true),
});

const taskSchema = z.object({
  name: z.string().min(3, { message: "Task name must be at least 3 characters" }),
  roomId: z.string().optional(),
  status: z.string().default("not_started"),
  dueDate: z.string().optional(),
  description: z.string().optional(),
  assignedTo: z.number().optional(),
});

const roomSchema = z.object({
  name: z.string().min(3, { message: "Room name must be at least 3 characters" }),
  type: z.string(),
  status: z.string().default("planned"),
});

type LogFormValues = z.infer<typeof logEntrySchema>;
type ReportFormValues = z.infer<typeof reportSchema>;
type TaskFormValues = z.infer<typeof taskSchema>;
type RoomFormValues = z.infer<typeof roomSchema>;

type ProjectReport = {
  id: number;
  project_id: number;
  user_id: number | null;
  report_type: string;
  start_date: string | null;
  end_date: string | null;
  includes_photos: boolean;
  includes_notes: boolean;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

type ReportSettings = {
  autoGenerate: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  includePhotos: boolean;
  includeNotes: boolean;
  recipients?: string[];
};

export default function UnifiedProjectTracker() {
  // URL parameter for project ID
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId || '';
  
  // General state
  const [view, setView] = useState<string>(projectId ? 'rooms' : 'projects');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);
  const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isReportSettingsDialogOpen, setIsReportSettingsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  
  // Selected item states
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date()
  });
  
  // Form setups
  const logForm = useForm<LogFormValues>({
    resolver: zodResolver(logEntrySchema),
    defaultValues: {
      text: "",
      type: "note",
    },
  });
  
  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "weekly",
      includePhotos: true,
      includeNotes: true,
    },
  });
  
  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      status: "not_started",
    },
  });
  
  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      type: "living",
      status: "planned",
    },
  });
  
  const settingsForm = useForm<{ reportSettings: ReportSettings }>({
    defaultValues: {
      reportSettings: {
        autoGenerate: false,
        frequency: 'weekly',
        includePhotos: true,
        includeNotes: true,
        recipients: [],
      }
    }
  });

  // =======================================================
  // QUERIES
  // =======================================================
  
  // Query project list
  const { 
    data: projects = [], 
    isLoading: projectsLoading 
  } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('/api/projects')
  });
  
  // Query specific project (if ID provided)
  const { 
    data: project, 
    isLoading: projectLoading 
  } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: () => fetch(`/api/projects/${projectId}`).then(res => res.json()),
    enabled: !!projectId,
  });
  
  // Query project logs
  const { 
    data: projectLogs = [], 
    isLoading: logsLoading 
  } = useQuery({
    queryKey: ['/api/project-logs', projectId],
    queryFn: () => fetch(`/api/project-logs?project_id=${projectId}`).then(res => res.json()),
    enabled: !!projectId,
  });
  
  // Query project reports
  const { 
    data: reports = [], 
    isLoading: reportsLoading 
  } = useQuery({
    queryKey: ['/api/project-reports', projectId],
    queryFn: () => fetch(`/api/project-reports?project_id=${projectId}`).then(res => res.json()),
    enabled: !!projectId,
  });

  // =======================================================
  // MUTATIONS
  // =======================================================
  
  // Create log entry mutation
  const addLogMutation = useMutation({
    mutationFn: (data: LogFormValues) => {
      return apiRequest(`/api/project-logs`, {
        method: 'POST',
        data: {
          ...data,
          project_id: parseInt(projectId)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/project-logs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "Log Added",
        description: "Project log entry has been added successfully."
      });
      setIsAddLogDialogOpen(false);
      logForm.reset();
    }
  });
  
  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (data: ReportFormValues) => {
      return apiRequest(`/api/project-reports`, {
        method: 'POST',
        data: {
          ...data,
          start_date: data.startDate,
          end_date: data.endDate,
          includes_photos: data.includePhotos,
          includes_notes: data.includeNotes,
          project_id: parseInt(projectId)
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Report created',
        description: 'New report has been created successfully.'
      });
      setIsGenerateReportDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/project-reports', projectId] });
    }
  });
  
  // Generate PDF for a report
  const generatePdfMutation = useMutation({
    mutationFn: async (reportId: number) => {
      setIsGenerating(true);
      return apiRequest(`/api/project-reports/${reportId}/pdf`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'PDF Generated',
        description: 'Report PDF has been generated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/project-reports', projectId] });
      setIsGenerating(false);
    }
  });
  
  // Delete a report
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest(`/api/project-reports/${reportId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Report deleted',
        description: 'Report has been deleted successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/project-reports', projectId] });
    }
  });
  
  // Add room mutation
  const addRoomMutation = useMutation({
    mutationFn: (data: RoomFormValues) => {
      // The project has a rooms array in jsonb format
      return apiRequest(`/api/projects/${projectId}/rooms`, {
        method: 'POST',
        data: {
          ...data,
          id: Date.now().toString(), // Generate a temporary ID
          created_at: new Date().toISOString(),
          progress: 0
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "Room Added",
        description: "Room has been added to the project successfully."
      });
      setIsAddRoomDialogOpen(false);
      roomForm.reset();
    }
  });
  
  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest(`/api/projects/${projectId}/rooms/${data.id}`, {
        method: 'PATCH',
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "Room Updated",
        description: "Room has been updated successfully."
      });
      setIsEditRoomDialogOpen(false);
    }
  });
  
  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: (data: TaskFormValues) => {
      return apiRequest(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        data: {
          ...data,
          id: Date.now().toString(), // Generate a temporary ID
          created_at: new Date().toISOString(),
          completed: false
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "Task Added",
        description: "Task has been added to the project successfully."
      });
      setIsAddTaskDialogOpen(false);
      taskForm.reset();
    }
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest(`/api/projects/${projectId}/tasks/${data.id}`, {
        method: 'PATCH',
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully."
      });
      setIsEditTaskDialogOpen(false);
    }
  });
  
  // Update project report settings
  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/projects/${projectId}`, {
        method: 'PATCH',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Report settings have been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      setIsReportSettingsDialogOpen(false);
    }
  });
  
  // =======================================================
  // EVENT HANDLERS
  // =======================================================
  
  // Handle adding a log entry
  const handleAddLog = (values: LogFormValues) => {
    addLogMutation.mutate(values);
  };
  
  // Handle generating a report
  const handleGenerateReport = (values: ReportFormValues) => {
    generateReportMutation.mutate(values);
  };
  
  // Handle adding a room
  const handleAddRoom = (values: RoomFormValues) => {
    addRoomMutation.mutate(values);
  };
  
  // Handle adding a task
  const handleAddTask = (values: TaskFormValues) => {
    addTaskMutation.mutate(values);
  };
  
  // Handle editing a room
  const handleEditRoom = (values: any) => {
    updateRoomMutation.mutate({
      ...selectedRoom,
      ...values
    });
  };
  
  // Handle editing a task
  const handleEditTask = (values: any) => {
    updateTaskMutation.mutate({
      ...selectedTask,
      ...values
    });
  };
  
  // Open the edit room dialog and set the selected room
  const openEditRoomDialog = (room: any) => {
    setSelectedRoom(room);
    roomForm.reset({
      name: room.name,
      type: room.type,
      status: room.status
    });
    setIsEditRoomDialogOpen(true);
  };
  
  // Open the edit task dialog and set the selected task
  const openEditTaskDialog = (task: any) => {
    setSelectedTask(task);
    taskForm.reset({
      name: task.name,
      roomId: task.roomId,
      status: task.status,
      dueDate: task.dueDate,
      description: task.description || "",
      assignedTo: task.assignedTo
    });
    setIsEditTaskDialogOpen(true);
  };
  
  // Handle saving report settings
  const onSaveSettings = (data: any) => {
    updateProjectMutation.mutate({
      reportSettings: data.reportSettings
    });
  };
  
  // Update settings form when project data is available
  React.useEffect(() => {
    if (project?.reportSettings) {
      settingsForm.reset({
        reportSettings: {
          autoGenerate: project.reportSettings.autoGenerate || false,
          frequency: project.reportSettings.frequency || 'weekly',
          includePhotos: project.reportSettings.includePhotos !== false,
          includeNotes: project.reportSettings.includeNotes !== false,
          recipients: project.reportSettings.recipients || []
        }
      });
    }
  }, [project, settingsForm]);
  
  // Helper functions
  const getRoomOptions = () => {
    if (project?.rooms && Array.isArray(project.rooms)) {
      return project.rooms.map((room: any) => ({
        id: room.id,
        label: room.name
      }));
    }
    return [];
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return 'secondary';
      case 'in progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'on hold':
        return 'yellow';
      case 'not_started':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Filter logs based on search and date filter
  const filteredLogs = React.useMemo(() => {
    if (!projectLogs || !Array.isArray(projectLogs)) return [];
    
    return projectLogs.filter((log: any) => {
      const matchesSearch = searchQuery === '' || 
        log.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.photo_caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.room_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filtering
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = format(new Date(log.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      } else if (dateFilter === 'week') {
        const oneWeekAgo = subDays(new Date(), 7);
        matchesDate = new Date(log.created_at) >= oneWeekAgo;
      } else if (dateFilter === 'month') {
        const oneMonthAgo = subDays(new Date(), 30);
        matchesDate = new Date(log.created_at) >= oneMonthAgo;
      }
      
      return matchesSearch && matchesDate;
    });
  }, [projectLogs, searchQuery, dateFilter]);
  
  // Loading states
  if (!projectId && projectsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (projectId && projectLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Create new project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest('/api/projects', { 
        method: 'POST',
        data: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project Created",
        description: "New project has been created successfully."
      });
      setIsNewProjectDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
    }
  });
  
  // Handle creating a new project
  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required.",
        variant: "destructive"
      });
      return;
    }
    
    createProjectMutation.mutate({
      name: newProjectName,
      description: newProjectDescription,
      status: "planning",
      progress: 0,
      rooms: [],
      tasks: [],
      logs: [],
      reportSettings: {
        autoGenerate: false,
        frequency: 'weekly',
        includePhotos: true,
        includeNotes: true
      }
    });
  };
  
  // Display projects list if no project is selected
  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-gray-500 mt-1">Select a project to manage rooms, tasks, logs, and reports</p>
          </div>
          <Button onClick={() => setIsNewProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
        
        {/* New Project Dialog */}
        <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to start tracking rooms, tasks, and progress.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="Enter project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Description (Optional)</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Enter project description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link key={project.id} href={`/unified-project-tracker/${project.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    {project.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant={project.status === "completed" ? "outline" : "default"}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {project.progress || 0}% Complete
                    </span>
                  </div>
                  
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 mr-1" />
                      {Array.isArray(project.rooms) ? project.rooms.length : 0} Rooms
                    </div>
                    <div className="flex items-center">
                      <ClipboardList className="h-4 w-4 mr-1" />
                      {Array.isArray(project.tasks) ? project.tasks.length : 0} Tasks
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }
  
  // Main project view
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <span>{project?.name}</span>
            <Badge variant="outline" className="ml-2">
              {project?.status}
            </Badge>
          </h1>
          <p className="text-gray-500 mt-1">{project?.description || "No description provided"}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddRoomDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
          <Button variant="outline" onClick={() => setIsAddTaskDialogOpen(true)}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          <Button variant="outline" onClick={() => setIsAddLogDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Log
          </Button>
          <Button variant="outline" onClick={() => setIsGenerateReportDialogOpen(true)}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>
      
      {/* Project Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div>
              <h3 className="text-lg font-medium">Project Progress</h3>
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold">{project?.progress || 0}%</span>
                <span className="text-sm text-gray-500 ml-2">Complete</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">
                  Started: {project?.startDate ? format(new Date(project.startDate), 'PPP') : 'Not set'}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-500">
                  Due: {project?.endDate ? format(new Date(project.endDate), 'PPP') : 'Not set'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${project?.progress || 0}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Main Tabs */}
      <Tabs defaultValue="rooms" className="w-full mb-6" onValueChange={setView}>
        <TabsList className="mb-2">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        {/* ROOMS TAB */}
        <TabsContent value="rooms" className="space-y-4">
          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search rooms..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Rooms display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project?.rooms && Array.isArray(project.rooms) && project.rooms
              .filter(room => statusFilter === 'all' || room.status.toLowerCase() === statusFilter.toLowerCase())
              .filter(room => searchQuery === '' || room.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((room: any) => (
                <Card key={room.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <Badge variant={getStatusBadgeColor(room.status)}>
                        {room.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{room.progress || 0}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${room.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditRoomDialog(room)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {/* View room details */}}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
        
        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Tasks table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project?.tasks && Array.isArray(project.tasks) ? (
                    project.tasks
                      .filter(task => statusFilter === 'all' || task.status === statusFilter)
                      .filter(task => searchQuery === '' || task.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((task: any) => {
                        // Find the room name based on roomId
                        const room = project.rooms?.find((r: any) => r.id === task.roomId);
                        const roomName = room?.name || "General";
                        
                        return (
                          <TableRow key={task.id}>
                            <TableCell>
                              <Checkbox 
                                checked={task.status === 'completed'} 
                                onCheckedChange={(checked) => {
                                  updateTaskMutation.mutate({
                                    ...task,
                                    status: checked ? 'completed' : 'in_progress'
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>{task.name}</TableCell>
                            <TableCell>{roomName}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeColor(task.status)}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? format(new Date(task.dueDate), 'PP') : 'Not set'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditTaskDialog(task)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* LOGS TAB */}
        <TabsContent value="logs" className="space-y-4">
          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search logs..." 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Timeline of logs */}
          <Card>
            <CardHeader>
              <CardTitle>Project Activity Log</CardTitle>
              <CardDescription>
                Chronological record of project progress, notes, and photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="space-y-6">
                  {filteredLogs.map((log: any) => {
                    const room = project?.rooms?.find((r: any) => r.id === log.room_id);
                    const roomName = room?.name || "General";
                    const logDate = new Date(log.created_at);
                    
                    return (
                      <div key={log.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {log.log_type === 'photo' ? (
                            <ImageIcon className="h-5 w-5 text-primary" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <span className="font-medium">{log.user_name || "System"}</span>
                            <span className="text-sm text-gray-500">
                              {format(logDate, 'PPp')}
                            </span>
                            <Badge variant="outline" className="w-fit">
                              {roomName}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-700">{log.text}</p>
                          
                          {log.log_type === 'photo' && log.photo_url && (
                            <div className="mt-2">
                              <div className="relative rounded-md overflow-hidden max-w-md">
                                <img 
                                  src={log.photo_url} 
                                  alt={log.photo_caption || "Project photo"} 
                                  className="w-full h-auto"
                                />
                                {log.photo_caption && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-sm">
                                    {log.photo_caption}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Info className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700">No logs found</h3>
                  <p className="text-gray-500 mt-1">
                    Start adding daily logs to track project progress
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Project Reports</h2>
              <p className="text-gray-500">Generate and view project progress reports</p>
            </div>
            <Button variant="outline" onClick={() => setIsReportSettingsDialogOpen(true)}>
              <LineChart className="h-4 w-4 mr-2" />
              Report Settings
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : reports && reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report: ProjectReport) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{report.report_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {report.start_date && report.end_date ? (
                            <span className="text-sm">
                              {format(new Date(report.start_date), 'MMM d, yyyy')} - {format(new Date(report.end_date), 'MMM d, yyyy')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {report.includes_photos && <Badge variant="secondary">Photos</Badge>}
                            {report.includes_notes && <Badge variant="secondary">Notes</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {report.pdf_url ? (
                              <a 
                                href={report.pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex"
                              >
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                              </a>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => generatePdfMutation.mutate(report.id)}
                                disabled={isGenerating || generatePdfMutation.isPending}
                              >
                                <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                                Generate PDF
                              </Button>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this report. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteReportMutation.mutate(report.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <FileTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700">No reports yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mt-1">
                    Generate a report to create a PDF document summarizing project logs and photos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* =================== DIALOGS =================== */}
      
      {/* Add Log Dialog */}
      <Dialog open={isAddLogDialogOpen} onOpenChange={setIsAddLogDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Log Entry</DialogTitle>
            <DialogDescription>
              Record progress, notes, or issues for the selected project.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...logForm}>
            <form onSubmit={logForm.handleSubmit(handleAddLog)} className="space-y-4">
              <FormField
                control={logForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select log type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="note">
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span>Note</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="photo">
                          <div className="flex items-center">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            <span>Photo with Note</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={logForm.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room/Area</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room or area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getRoomOptions().map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={logForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Entry</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the progress, changes, or issues..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {logForm.watch("type") === "photo" && (
                <div className="space-y-4">
                  <FormField
                    control={logForm.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <label 
                                htmlFor="photo-upload" 
                                className="flex items-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photo
                                <input
                                  id="photo-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // In a real implementation, you would upload the file here
                                      // For demo purposes, we'll simulate a successful upload
                                      console.log("Selected file:", file.name);
                                      
                                      // Create a local preview URL
                                      const localUrl = URL.createObjectURL(file);
                                      field.onChange(localUrl);
                                      
                                      // Set the photo caption to the filename by default
                                      const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.');
                                      logForm.setValue('photoCaption', fileNameWithoutExt);
                                    }
                                  }}
                                />
                              </label>
                              {field.value && (
                                <div className="text-sm text-green-600">Photo selected</div>
                              )}
                            </div>
                            
                            {field.value && field.value.startsWith('blob:') && (
                              <div className="mt-2 relative">
                                <img 
                                  src={field.value} 
                                  alt="Selected" 
                                  className="max-h-32 rounded-md border border-border"
                                />
                              </div>
                            )}
                          </div>
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
                        <FormLabel>Photo Caption</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Describe what's shown in the photo"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={addLogMutation.isPending}>
                  {addLogMutation.isPending ? 'Adding...' : 'Add Log Entry'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Room Dialog */}
      <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Add a room or area to organize your project.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...roomForm}>
            <form onSubmit={roomForm.handleSubmit(handleAddRoom)} className="space-y-4">
              <FormField
                control={roomForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Living Room, Kitchen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={roomForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="living">Living Room</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                        <SelectItem value="bathroom">Bathroom</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={roomForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addRoomMutation.isPending}>
                  {addRoomMutation.isPending ? 'Adding...' : 'Add Room'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Room Dialog */}
      <Dialog open={isEditRoomDialogOpen} onOpenChange={setIsEditRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room details and progress.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...roomForm}>
            <form onSubmit={roomForm.handleSubmit(handleEditRoom)} className="space-y-4">
              <FormField
                control={roomForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={roomForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="living">Living Room</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                        <SelectItem value="bathroom">Bathroom</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={roomForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label>Progress</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    defaultValue={selectedRoom?.progress || 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      roomForm.setValue('progress', value);
                    }}
                    className="w-full"
                  />
                  <span className="min-w-10 text-right">
                    {roomForm.watch('progress') || selectedRoom?.progress || 0}%
                  </span>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={updateRoomMutation.isPending}>
                  {updateRoomMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for your project.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(handleAddTask)} className="space-y-4">
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
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room/Area</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room or area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getRoomOptions().map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={taskForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Textarea 
                        placeholder="Add details about this task..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addTaskMutation.isPending}>
                  {addTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Generate Report Dialog */}
      <Dialog open={isGenerateReportDialogOpen} onOpenChange={setIsGenerateReportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate New Report</DialogTitle>
            <DialogDescription>
              Create a new project report for a specific time period.
            </DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(handleGenerateReport)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label>Date Range</Label>
                <DateRangePicker
                  initialDateFrom={dateRange.from}
                  initialDateTo={dateRange.to}
                  onUpdate={(range) => setDateRange({
                    from: range.from || dateRange.from,
                    to: range.to || dateRange.to
                  })}
                />
              </div>
              
              <div className="flex space-x-6">
                <FormField
                  control={reportForm.control}
                  name="includePhotos"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Include Photos</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={reportForm.control}
                  name="includeNotes"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Include Notes</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={generateReportMutation.isPending}>
                  {generateReportMutation.isPending ? 'Creating...' : 'Create Report'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Report Settings Dialog */}
      <Dialog open={isReportSettingsDialogOpen} onOpenChange={setIsReportSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Settings</DialogTitle>
            <DialogDescription>
              Configure automatic report generation and notifications
            </DialogDescription>
          </DialogHeader>
          
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-4">
              <FormField
                control={settingsForm.control}
                name="reportSettings.autoGenerate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-generate Reports</FormLabel>
                      <FormDescription>
                        Automatically generate reports on a regular schedule
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {settingsForm.watch("reportSettings.autoGenerate") && (
                <FormField
                  control={settingsForm.control}
                  name="reportSettings.frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often reports should be automatically generated
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={settingsForm.control}
                name="reportSettings.includePhotos"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Photos</FormLabel>
                      <FormDescription>
                        Include project photos in generated reports
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="reportSettings.includeNotes"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Notes</FormLabel>
                      <FormDescription>
                        Include project notes and logs in generated reports
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateProjectMutation.isPending}>
                  {updateProjectMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}