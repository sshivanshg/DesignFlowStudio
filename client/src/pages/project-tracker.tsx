import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Clipboard, 
  ClipboardList, 
  Clock, 
  Layers, 
  List, 
  MapPin, 
  MessageSquare, 
  Plus, 
  Search,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function ProjectTracker() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [view, setView] = useState<string>('rooms');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    location: '',
    description: '',
    status: 'planning'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects query
  const { isLoading, error, data: projects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      return fetch('/api/projects').then(res => res.json());
    },
  });

  // Fetch project details query (including rooms, tasks, etc)
  const { data: projectDetails } = useQuery({
    queryKey: ['/api/projects', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return null;
      return fetch(`/api/projects/${selectedProject}`).then(res => res.json());
    },
    enabled: !!selectedProject,
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: typeof newProject) => 
      apiRequest('/api/projects', 'POST', projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsNewProjectDialogOpen(false);
      setNewProject({
        name: '',
        location: '',
        description: '',
        status: 'planning'
      });
      toast({
        title: "Project created",
        description: "Your new project has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating project:", error);
    }
  });

  // Mock data for initial design
  const mockProjects = [
    { id: 1, name: "Modern Apartment Redesign", location: "New York, NY", progress: 65, status: "In Progress" },
    { id: 2, name: "Coastal Beach House", location: "Malibu, CA", progress: 30, status: "In Progress" },
    { id: 3, name: "Corporate Office Renovation", location: "Chicago, IL", progress: 90, status: "Almost Complete" },
    { id: 4, name: "Mountain Cabin Remodel", location: "Aspen, CO", progress: 10, status: "Just Started" },
  ];

  const mockRooms = [
    { id: 1, name: "Living Room", type: "living", progress: 75, tasks: 12, completedTasks: 9 },
    { id: 2, name: "Master Bedroom", type: "bedroom", progress: 45, tasks: 8, completedTasks: 4 },
    { id: 3, name: "Kitchen", type: "kitchen", progress: 60, tasks: 15, completedTasks: 9 },
    { id: 4, name: "Bathroom", type: "bathroom", progress: 20, tasks: 10, completedTasks: 2 },
    { id: 5, name: "Home Office", type: "office", progress: 90, tasks: 6, completedTasks: 5 },
  ];

  const mockTasks = [
    { id: 1, roomId: 1, name: "Paint walls", status: "completed", dueDate: "2025-05-20", assignedTo: "John Doe" },
    { id: 2, roomId: 1, name: "Install new flooring", status: "completed", dueDate: "2025-05-15", assignedTo: "Jane Smith" },
    { id: 3, roomId: 1, name: "Hang curtains", status: "in_progress", dueDate: "2025-05-25", assignedTo: "John Doe" },
    { id: 4, roomId: 2, name: "Assemble bed frame", status: "in_progress", dueDate: "2025-05-18", assignedTo: "Mark Wilson" },
    { id: 5, roomId: 2, name: "Install lighting", status: "not_started", dueDate: "2025-05-30", assignedTo: "Jane Smith" },
    { id: 6, roomId: 3, name: "Replace countertops", status: "in_progress", dueDate: "2025-05-22", assignedTo: "Mark Wilson" },
    { id: 7, roomId: 3, name: "Install backsplash", status: "delayed", dueDate: "2025-05-10", assignedTo: "John Doe" },
  ];

  // Helper function to get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">In Progress</Badge>;
      case "not_started":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Not Started</Badge>;
      case "delayed":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Delayed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter tasks based on search query and status filter
  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get the room name for a given room ID
  const getRoomName = (roomId: number) => {
    const room = mockRooms.find(r => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Project Tracker</h1>
          <p className="text-gray-500 mt-1">Track progress by room, manage tasks, and generate reports</p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Select a project to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockProjects.map((project) => (
                <div
                  key={project.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedProject === project.id.toString() 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedProject(project.id.toString())}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {project.location}
                      </div>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <div className="mt-3">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProject ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {mockProjects.find(p => p.id.toString() === selectedProject)?.name || 'Project Details'}
                      </CardTitle>
                      <CardDescription>
                        {mockProjects.find(p => p.id.toString() === selectedProject)?.location || 'Location'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {mockProjects.find(p => p.id.toString() === selectedProject)?.status || 'Status'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2 mb-4">
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setView('rooms')}>
                      <Layers className="h-4 w-4 mr-2" />
                      Rooms & Zones
                    </Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setView('tasks')}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Tasks
                    </Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setView('logs')}>
                      <List className="h-4 w-4 mr-2" />
                      Progress Logs
                    </Button>
                  </div>

                  <Tabs defaultValue={view} value={view} onValueChange={setView}>
                    <TabsContent value="rooms" className="pt-4">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Rooms & Zones</h3>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Room
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {mockRooms.map(room => (
                          <div key={room.id} className="border rounded-md p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start">
                                <div className="rounded-full bg-gray-100 p-2 mr-3">
                                  {room.type === 'living' && <Layers className="h-5 w-5 text-blue-500" />}
                                  {room.type === 'bedroom' && <Layers className="h-5 w-5 text-purple-500" />}
                                  {room.type === 'kitchen' && <Layers className="h-5 w-5 text-amber-500" />}
                                  {room.type === 'bathroom' && <Layers className="h-5 w-5 text-emerald-500" />}
                                  {room.type === 'office' && <Layers className="h-5 w-5 text-indigo-500" />}
                                </div>
                                <div>
                                  <h3 className="font-medium">{room.name}</h3>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs text-gray-500 mr-3">
                                      {room.completedTasks} of {room.tasks} tasks completed
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {room.type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-medium">{room.progress}%</span>
                                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${room.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex mt-3 space-x-2">
                              <Button variant="outline" size="sm">
                                <ClipboardList className="h-3.5 w-3.5 mr-1" />
                                Tasks
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                Add Note
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="pt-4">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Tasks</h3>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Task
                        </Button>
                      </div>
                      <div className="flex justify-between items-center mb-4 gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search tasks..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select 
                          value={statusFilter} 
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTasks.map(task => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.name}</TableCell>
                              <TableCell>{getRoomName(task.roomId)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(task.status)}</TableCell>
                              <TableCell>{task.assignedTo}</TableCell>
                            </TableRow>
                          ))}
                          {filteredTasks.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No tasks found. Try adjusting your filters.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="logs" className="pt-4">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Progress Logs</h3>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Log Entry
                        </Button>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800">Coming Soon</h4>
                            <p className="text-sm text-amber-700">
                              Progress logs feature is under development and will be available soon.
                              This feature will allow you to track daily progress with photos and notes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clipboard className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No Project Selected</h3>
                <p className="text-gray-500 text-center max-w-md mt-1">
                  Select a project from the list to see its details, track rooms, manage tasks, and view progress logs.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}