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
  Eye,
  Layers, 
  List, 
  MapPin, 
  MessageSquare, 
  Pencil,
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
  
  // Dialog states for rooms, tasks, and logs
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState("living");
  
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [taskStatus, setTaskStatus] = useState("not_started");
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // One week from now
    return date.toISOString().split('T')[0];
  });
  
  const [addLogOpen, setAddLogOpen] = useState(false);
  const [logText, setLogText] = useState("");
  const [logType, setLogType] = useState("note");
  
  // Room note states
  const [addRoomNoteOpen, setAddRoomNoteOpen] = useState(false);
  const [roomNoteText, setRoomNoteText] = useState("");
  const [selectedRoomForNote, setSelectedRoomForNote] = useState<string>("");
  const [viewNotesOpen, setViewNotesOpen] = useState(false);
  const [selectedRoomNotes, setSelectedRoomNotes] = useState<any[]>([]);
  const [selectedRoomName, setSelectedRoomName] = useState("");
  
  // Room edit states
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomType, setEditRoomType] = useState("");
  
  // Task edit states
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editTaskStatus, setEditTaskStatus] = useState("");
  
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
  const { data: projectDetails, refetch: refetchProjectDetails } = useQuery({
    queryKey: ['/api/projects', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return null;
      return fetch(`/api/projects/${selectedProject}`).then(res => res.json());
    },
    enabled: !!selectedProject,
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: typeof newProject) => {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    },
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

  // Helper functions for project data
  const getProjectProgress = (project: any) => {
    if (!project) return 0;
    return project.progress || 0;
  };
  
  const getProjectStatus = (project: any) => {
    if (!project) return "Planning";
    return project.status || "Planning";
  };
  
  const getProjectLocation = (project: any) => {
    if (!project) return "";
    return project.location || "No location specified";
  };

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
  const filteredTasks = projectDetails?.tasks ? 
    (Array.isArray(projectDetails.tasks) ? projectDetails.tasks : []).filter((task: any) => {
      const matchesSearch = searchQuery === '' || 
        (task.name && task.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    : [];

  // Get the room name for a given room ID
  const getRoomName = (roomId: string | number) => {
    if (!projectDetails?.rooms || !Array.isArray(projectDetails.rooms)) return 'Unknown Room';
    const room = projectDetails.rooms.find((r: any) => r.id === roomId);
    return room ? room.name : 'Unknown Room';
  };

  // Handle input changes for new project form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(newProject);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Project Tracker</h1>
          <p className="text-gray-500 mt-1">Track progress by room, manage tasks, and generate reports</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsNewProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
      
      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add the details for your new project. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={newProject.name}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={newProject.location}
                  onChange={handleInputChange}
                  placeholder="City, State"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newProject.description}
                  onChange={handleInputChange}
                  placeholder="Project description..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  name="status" 
                  value={newProject.status} 
                  onValueChange={(value) => handleInputChange({ target: { name: 'status', value } } as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsNewProjectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Select a project to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin h-6 w-6 border-t-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading projects...</p>
                </div>
              ) : error ? (
                <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-600">
                  <p>Error loading projects. Please try again.</p>
                </div>
              ) : projects && projects.length > 0 ? (
                projects.map((project: any) => (
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
                          {getProjectLocation(project)}
                        </div>
                      </div>
                      <Badge variant="outline">{getProjectStatus(project)}</Badge>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{getProjectProgress(project)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${getProjectProgress(project)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-gray-200 rounded-md text-center text-gray-500">
                  <p>No projects found. Create your first project to get started.</p>
                </div>
              )}
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
                        {projectDetails?.name || 'Project Details'}
                      </CardTitle>
                      <CardDescription>
                        {getProjectLocation(projectDetails)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {getProjectStatus(projectDetails)}
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
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!projectDetails || !selectedProject) {
                              toast({
                                title: "Error",
                                description: "Please select a project first",
                                variant: "destructive",
                              });
                              return;
                            }
                            setAddRoomOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Room
                        </Button>
                      </div>
                      
                      {/* Add Room Dialog */}
                      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Room</DialogTitle>
                            <DialogDescription>
                              Add a new room or zone to the project
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="room-name" className="text-right">
                                Name
                              </Label>
                              <Input
                                id="room-name"
                                placeholder="Enter room name"
                                className="col-span-3"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="room-type" className="text-right">
                                Type
                              </Label>
                              <Select 
                                value={newRoomType} 
                                onValueChange={setNewRoomType}
                              >
                                <SelectTrigger id="room-type" className="col-span-3">
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="living">Living Room</SelectItem>
                                  <SelectItem value="bedroom">Bedroom</SelectItem>
                                  <SelectItem value="kitchen">Kitchen</SelectItem>
                                  <SelectItem value="bathroom">Bathroom</SelectItem>
                                  <SelectItem value="office">Office</SelectItem>
                                  <SelectItem value="dining">Dining Room</SelectItem>
                                  <SelectItem value="outdoor">Outdoor Space</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                if (!newRoomName.trim()) {
                                  toast({
                                    title: "Error",
                                    description: "Room name is required",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                // Add a new room to the project
                                const newRoom = {
                                  id: Date.now().toString(),
                                  name: newRoomName,
                                  type: newRoomType,
                                  progress: 0,
                                  tasks: 0,
                                  completedTasks: 0
                                };
                                
                                // Prepare updated rooms array
                                const updatedRooms = projectDetails?.rooms && Array.isArray(projectDetails.rooms) 
                                  ? [...projectDetails.rooms, newRoom]
                                  : [newRoom];
                                
                                // Update the project with the new room
                                fetch(`/api/projects/${selectedProject}`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    rooms: updatedRooms
                                  }),
                                })
                                .then(response => {
                                  if (!response.ok) throw new Error('Failed to add room');
                                  return response.json();
                                })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject] });
                                  toast({
                                    title: "Room added",
                                    description: `New room "${newRoomName}" has been added successfully`,
                                  });
                                  // Reset form and close dialog
                                  setNewRoomName("");
                                  setNewRoomType("living");
                                  setAddRoomOpen(false);
                                })
                                .catch(error => {
                                  console.error('Error adding room:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to add room. Please try again.",
                                    variant: "destructive",
                                  });
                                });
                              }}
                            >
                              Add Room
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <div className="space-y-3">
                        {!projectDetails ? (
                          <div className="p-8 text-center">
                            <p className="text-sm text-gray-500">Select a project to view rooms</p>
                          </div>
                        ) : projectDetails.rooms && Array.isArray(projectDetails.rooms) && projectDetails.rooms.length > 0 ? (
                          projectDetails.rooms.map((room: any, index: number) => (
                            <div key={room.id || index} className="border rounded-md p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start">
                                  <div className="rounded-full bg-gray-100 p-2 mr-3">
                                    {room.type === 'living' && <Layers className="h-5 w-5 text-blue-500" />}
                                    {room.type === 'bedroom' && <Layers className="h-5 w-5 text-purple-500" />}
                                    {room.type === 'kitchen' && <Layers className="h-5 w-5 text-amber-500" />}
                                    {room.type === 'bathroom' && <Layers className="h-5 w-5 text-emerald-500" />}
                                    {room.type === 'office' && <Layers className="h-5 w-5 text-indigo-500" />}
                                    {(!room.type || !['living', 'bedroom', 'kitchen', 'bathroom', 'office'].includes(room.type)) && 
                                      <Layers className="h-5 w-5 text-gray-500" />}
                                  </div>
                                  <div>
                                    <h3 className="font-medium">{room.name}</h3>
                                    <div className="flex items-center mt-1">
                                      <span className="text-xs text-gray-500 mr-3">
                                        {room.completedTasks || 0} of {room.tasks || 0} tasks completed
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {room.type || 'room'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-medium">{room.progress || 0}%</span>
                                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${room.progress || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex mt-3 space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRoom(room);
                                    setEditRoomName(room.name || '');
                                    setEditRoomType(room.type || 'room');
                                    setEditRoomOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Edit Room
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (!projectDetails || !selectedProject) {
                                      toast({
                                        title: "Error",
                                        description: "Please select a project first",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    // Find tasks for this room
                                    const roomTasks = projectDetails.tasks?.filter(
                                      (task: any) => task.roomId === room.id
                                    ) || [];
                                    
                                    // Show info toast if no tasks
                                    if (roomTasks.length === 0) {
                                      toast({
                                        title: "No Tasks",
                                        description: "There are no tasks for this room yet.",
                                      });
                                      return;
                                    }
                                    
                                    // Set selected room and view to tasks
                                    setSelectedRoomId(room.id);
                                    setView('tasks');
                                  }}
                                >
                                  <ClipboardList className="h-3.5 w-3.5 mr-1" />
                                  Tasks ({room.tasks || 0})
                                </Button>
                                
                                <div className="flex space-x-1">
                                  <Button 
                                    variant={room.notes && room.notes.length > 0 ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      if (!projectDetails || !selectedProject) {
                                        toast({
                                          title: "Error",
                                          description: "Please select a project first",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      if (!room.notes || room.notes.length === 0) {
                                        toast({
                                          title: "No Notes",
                                          description: "There are no notes for this room yet.",
                                        });
                                        return;
                                      }
                                      
                                      // Set the selected room notes for viewing
                                      setSelectedRoomNotes(room.notes);
                                      setSelectedRoomName(room.name);
                                      setViewNotesOpen(true);
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    Notes {room.notes ? `(${room.notes.length})` : '(0)'}
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      if (!projectDetails || !selectedProject) {
                                        toast({
                                          title: "Error",
                                          description: "Please select a project first",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      setSelectedRoomForNote(room.id);
                                      setAddRoomNoteOpen(true);
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 border border-gray-200 rounded-md text-center text-gray-500">
                            <p>No rooms found. Add a room to get started.</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Add Room Note Dialog */}
                      <Dialog open={addRoomNoteOpen} onOpenChange={setAddRoomNoteOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Room Note</DialogTitle>
                            <DialogDescription>
                              Add a note for this room to track important details.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="room-note" className="text-right">
                                Note
                              </Label>
                              <textarea
                                id="room-note"
                                placeholder="Enter room note details"
                                className="col-span-3 min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                                value={roomNoteText}
                                onChange={(e) => setRoomNoteText(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                if (!roomNoteText.trim()) {
                                  toast({
                                    title: "Error",
                                    description: "Note text is required",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                // Find the room to update
                                const roomIndex = projectDetails?.rooms?.findIndex(
                                  (r: any) => r.id === selectedRoomForNote
                                );
                                
                                if (roomIndex === undefined || roomIndex === -1 || !projectDetails?.rooms) {
                                  toast({
                                    title: "Error",
                                    description: "Room not found",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                // Create a copy of the rooms array
                                const updatedRooms = [...(projectDetails.rooms || [])];
                                
                                // Update the room with the note
                                updatedRooms[roomIndex] = {
                                  ...updatedRooms[roomIndex],
                                  notes: updatedRooms[roomIndex].notes 
                                    ? [...updatedRooms[roomIndex].notes, { 
                                        id: Date.now().toString(),
                                        text: roomNoteText,
                                        date: new Date().toISOString()
                                      }]
                                    : [{ 
                                        id: Date.now().toString(),
                                        text: roomNoteText,
                                        date: new Date().toISOString()
                                      }]
                                };
                                
                                // Update the project with the new room data
                                fetch(`/api/projects/${selectedProject}`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    rooms: updatedRooms
                                  }),
                                })
                                .then(response => {
                                  if (!response.ok) throw new Error('Failed to add note to room');
                                  return response.json();
                                })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject] });
                                  toast({
                                    title: "Note added",
                                    description: `Note has been added to the room successfully`,
                                  });
                                  
                                  // Reset form and close dialog
                                  setRoomNoteText("");
                                  setSelectedRoomForNote("");
                                  setAddRoomNoteOpen(false);
                                })
                                .catch(error => {
                                  console.error('Error adding note to room:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to add note to room. Please try again.",
                                    variant: "destructive",
                                  });
                                });
                              }}
                            >
                              Add Note
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {/* View Room Notes Dialog */}
                      <Dialog open={viewNotesOpen} onOpenChange={setViewNotesOpen}>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Notes for {selectedRoomName}</DialogTitle>
                            <DialogDescription>
                              View all notes for this room
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 my-4 max-h-[400px] overflow-y-auto">
                            {selectedRoomNotes.map((note: any, index: number) => (
                              <div key={note.id || index} className="p-4 border rounded-md">
                                <div className="flex justify-between items-start">
                                  <div className="font-medium text-sm">
                                    {note.date ? new Date(note.date).toLocaleString() : 'No date'}
                                  </div>
                                </div>
                                <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                                  {note.text}
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          <DialogFooter>
                            <Button onClick={() => setViewNotesOpen(false)}>
                              Close
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TabsContent>
                    
                    {/* Edit Task Status Dialog */}
                    <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Task Status</DialogTitle>
                          <DialogDescription>
                            Update the status of this task.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {selectedTask && (
                            <>
                              <div className="grid grid-cols-1 gap-2">
                                <Label className="font-medium text-gray-700">Task</Label>
                                <p className="text-sm text-gray-600">{selectedTask.name}</p>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <Label className="font-medium text-gray-700">Room</Label>
                                <p className="text-sm text-gray-600">{getRoomName(selectedTask.roomId)}</p>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="edit-task-status">Status</Label>
                                <Select 
                                  value={editTaskStatus} 
                                  onValueChange={setEditTaskStatus}
                                >
                                  <SelectTrigger id="edit-task-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_started">Not Started</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="delayed">Delayed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditTaskOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (!selectedTask || !projectDetails || !selectedProject) return;
                              
                              // Update the task status
                              const updatedTasks = projectDetails.tasks.map((task: any) => {
                                if (task.id === selectedTask.id) {
                                  return { ...task, status: editTaskStatus };
                                }
                                return task;
                              });
                              
                              // Calculate updated room metrics based on the task status change
                              const updatedRooms = projectDetails.rooms.map((room: any) => {
                                // Get tasks for this room
                                const roomTasks = updatedTasks.filter((task: any) => task.roomId === room.id);
                                
                                // Count total and completed tasks
                                const totalTasks = roomTasks.length;
                                const completedTasks = roomTasks.filter(
                                  (task: any) => task.status === 'completed'
                                ).length;
                                
                                const inProgressTasks = roomTasks.filter(
                                  (task: any) => task.status === 'in_progress'
                                ).length;
                                
                                // Calculate progress percentage based on weighted values
                                // Completed tasks count as 100%, in-progress as 50%
                                const progress = totalTasks > 0 
                                  ? Math.round(((completedTasks + (inProgressTasks * 0.5)) / totalTasks) * 100) 
                                  : 0;
                                
                                // Return updated room with new counts and progress
                                return {
                                  ...room,
                                  tasks: totalTasks,
                                  completedTasks: completedTasks,
                                  progress: progress
                                };
                              });
                              
                              // Update the project details with the updated tasks and rooms
                              const updatedProjectDetails = {
                                ...projectDetails,
                                tasks: updatedTasks,
                                rooms: updatedRooms,
                              };
                              
                              // Save to API
                              fetch(`/api/projects/${selectedProject}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(updatedProjectDetails),
                              })
                                .then(response => {
                                  if (!response.ok) {
                                    throw new Error(`Error: ${response.status}`);
                                  }
                                  // Manually update UI state
                                  // Success toast
                                  toast({
                                    title: "Success",
                                    description: "Task status updated successfully",
                                  });
                                  
                                  // Invalidate all project-related queries to ensure full UI refresh
                                  queryClient.invalidateQueries({ 
                                    queryKey: ['/api/projects'] 
                                  });
                                  
                                  // Force immediate refetch of the specific project details
                                  refetchProjectDetails();
                                  
                                  // Update the task filter status for immediate UI update if we're on the tasks tab
                                  if (view === 'tasks') {
                                    // Temporarily set to 'all' and back to current filter to force refresh
                                    const currentFilter = statusFilter;
                                    setStatusFilter('all');
                                    
                                    // Use setTimeout to ensure the state update happens in the next tick
                                    setTimeout(() => {
                                      setStatusFilter(currentFilter);
                                    }, 100);
                                  }
                                  
                                  // Close the dialog
                                  setEditTaskOpen(false);
                                })
                                .catch(error => {
                                  console.error('Error updating task status:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to update task status. Please try again.",
                                    variant: "destructive",
                                  });
                                });
                            }}
                          >
                            Update Status
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Edit Room Dialog */}
                    <Dialog open={editRoomOpen} onOpenChange={setEditRoomOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Room</DialogTitle>
                          <DialogDescription>
                            Update room details below.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="room-name" className="text-right">
                              Name
                            </label>
                            <Input
                              id="room-name"
                              value={editRoomName}
                              onChange={(e) => setEditRoomName(e.target.value)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="room-type" className="text-right">
                              Type
                            </label>
                            <Select
                              value={editRoomType}
                              onValueChange={(value) => setEditRoomType(value)}
                            >
                              <SelectTrigger id="room-type" className="col-span-3">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="room">Room</SelectItem>
                                <SelectItem value="area">Area</SelectItem>
                                <SelectItem value="zone">Zone</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditRoomOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (!editRoomName.trim()) {
                                toast({
                                  title: "Error",
                                  description: "Room name is required",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              if (!projectDetails || !selectedProject || !selectedRoom) {
                                toast({
                                  title: "Error",
                                  description: "Could not update room. Missing data.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              // Update the room
                              const updatedRooms = projectDetails.rooms.map((room: any) => {
                                if (room.id === selectedRoom.id) {
                                  return {
                                    ...room,
                                    name: editRoomName,
                                    type: editRoomType
                                  };
                                }
                                return room;
                              });
                              
                              // Update project details
                              const updatedProjectDetails = {
                                ...projectDetails,
                                rooms: updatedRooms
                              };
                              
                              // Save to API
                              fetch(`/api/projects/${selectedProject}`, {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify(updatedProjectDetails)
                              })
                                .then(response => {
                                  if (!response.ok) {
                                    throw new Error("Failed to update room");
                                  }
                                  return response.json();
                                })
                                .then(() => {
                                  // Refresh project data
                                  refetchProjectDetails();
                                  
                                  // Show success message
                                  toast({
                                    title: "Success",
                                    description: "Room updated successfully",
                                  });
                                  
                                  // Close dialog
                                  setEditRoomOpen(false);
                                })
                                .catch(error => {
                                  console.error("Error updating room:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to update room: " + error.message,
                                    variant: "destructive",
                                  });
                                });
                            }}
                          >
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <TabsContent value="tasks" className="pt-4">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Tasks</h3>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!projectDetails || !selectedProject) {
                              toast({
                                title: "Error",
                                description: "Please select a project first",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (projectDetails.rooms && Array.isArray(projectDetails.rooms) && projectDetails.rooms.length > 0) {
                              setSelectedRoomId(projectDetails.rooms[0].id);
                              setAddTaskOpen(true);
                            } else {
                              toast({
                                title: "Warning",
                                description: "No rooms found. Please add a room first.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Task
                        </Button>
                      </div>
                      
                      {/* Add Task Dialog */}
                      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Task</DialogTitle>
                            <DialogDescription>
                              Create a new task for this project
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-name" className="text-right">
                                Task Name
                              </Label>
                              <Input
                                id="task-name"
                                placeholder="Enter task name"
                                className="col-span-3"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                              />
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-room" className="text-right">
                                Room
                              </Label>
                              <Select 
                                value={selectedRoomId} 
                                onValueChange={setSelectedRoomId}
                              >
                                <SelectTrigger id="task-room" className="col-span-3">
                                  <SelectValue placeholder="Select room" />
                                </SelectTrigger>
                                <SelectContent>
                                  {projectDetails?.rooms?.map((room: any) => (
                                    <SelectItem key={room.id} value={room.id}>
                                      {room.name} ({room.type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-status" className="text-right">
                                Status
                              </Label>
                              <Select 
                                value={taskStatus} 
                                onValueChange={setTaskStatus}
                              >
                                <SelectTrigger id="task-status" className="col-span-3">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="not_started">Not Started</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="on_hold">On Hold</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="task-due-date" className="text-right">
                                Due Date
                              </Label>
                              <Input
                                id="task-due-date"
                                type="date"
                                className="col-span-3"
                                value={taskDueDate}
                                onChange={(e) => setTaskDueDate(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                if (!newTaskName.trim()) {
                                  toast({
                                    title: "Error",
                                    description: "Task name is required",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                if (!selectedRoomId) {
                                  toast({
                                    title: "Error",
                                    description: "Please select a room",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                // Create new task
                                const newTask = {
                                  id: Date.now().toString(),
                                  name: newTaskName,
                                  status: taskStatus,
                                  roomId: selectedRoomId,
                                  assignedTo: "",
                                  dueDate: taskDueDate,
                                };
                                
                                // Prepare updated tasks array
                                const updatedTasks = projectDetails.tasks && Array.isArray(projectDetails.tasks) 
                                  ? [...projectDetails.tasks, newTask]
                                  : [newTask];
                                
                                // Update the project with the new task
                                fetch(`/api/projects/${selectedProject}`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    tasks: updatedTasks
                                  }),
                                })
                                .then(response => {
                                  if (!response.ok) throw new Error('Failed to add task');
                                  return response.json();
                                })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject] });
                                  toast({
                                    title: "Task added",
                                    description: `New task "${newTaskName}" has been added successfully`,
                                  });
                                  
                                  // Reset form and close dialog
                                  setNewTaskName("");
                                  setTaskStatus("not_started");
                                  const date = new Date();
                                  date.setDate(date.getDate() + 7);
                                  setTaskDueDate(date.toISOString().split('T')[0]);
                                  setAddTaskOpen(false);
                                })
                                .catch(error => {
                                  console.error('Error adding task:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to add task. Please try again.",
                                    variant: "destructive",
                                  });
                                });
                              }}
                            >
                              Add Task
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
                          {projectDetails ? (
                            <>
                              {filteredTasks.length > 0 ? (
                                filteredTasks.map((task: any, index: number) => (
                                  <TableRow key={task.id || index}>
                                    <TableCell className="font-medium">{task.name}</TableCell>
                                    <TableCell>{getRoomName(task.roomId)}</TableCell>
                                    <TableCell>
                                      {task.dueDate ? (
                                        <div className="flex items-center">
                                          <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400">No due date</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        {getStatusBadge(task.status || 'not_started')}
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6"
                                          onClick={() => {
                                            setSelectedTask(task);
                                            setEditTaskStatus(task.status || 'not_started');
                                            setEditTaskOpen(true);
                                          }}
                                        >
                                          <span className="sr-only">Edit task status</span>
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                    <TableCell>{task.assignedTo || 'Unassigned'}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    {statusFilter !== 'all' ? (
                                      <div className="flex flex-col items-center">
                                        <AlertTriangle className="h-5 w-5 text-gray-400 mb-1" />
                                        No tasks matching the selected status filter
                                      </div>
                                    ) : searchQuery ? (
                                      <div className="flex flex-col items-center">
                                        <Search className="h-5 w-5 text-gray-400 mb-1" />
                                        No tasks matching your search
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <CheckCircle className="h-5 w-5 text-gray-400 mb-1" />
                                        No tasks found for this project
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                <div className="flex flex-col items-center">
                                  <AlertTriangle className="h-5 w-5 text-gray-400 mb-1" />
                                  Select a project to view tasks
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    <TabsContent value="logs" className="pt-4">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Progress Logs</h3>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (!projectDetails || !selectedProject) {
                              toast({
                                title: "Error",
                                description: "Please select a project first",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            setAddLogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Log Entry
                        </Button>
                      </div>
                      
                      {/* Add Log Dialog */}
                      <Dialog open={addLogOpen} onOpenChange={setAddLogOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Progress Log</DialogTitle>
                            <DialogDescription>
                              Add a new log entry to track project progress
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="log-type" className="text-right">
                                Log Type
                              </Label>
                              <Select 
                                value={logType} 
                                onValueChange={setLogType}
                              >
                                <SelectTrigger id="log-type" className="col-span-3">
                                  <SelectValue placeholder="Select log type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="note">Note</SelectItem>
                                  <SelectItem value="progress">Progress Update</SelectItem>
                                  <SelectItem value="issue">Issue</SelectItem>
                                  <SelectItem value="communication">Communication</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="log-text" className="text-right">
                                Log Details
                              </Label>
                              <textarea
                                id="log-text"
                                placeholder="Enter log details"
                                className="col-span-3 min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                                value={logText}
                                onChange={(e) => setLogText(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              onClick={() => {
                                if (!logText.trim()) {
                                  toast({
                                    title: "Error",
                                    description: "Log text is required",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                // Create a new log entry
                                const date = new Date();
                                const newLog = {
                                  id: Date.now().toString(),
                                  date: date.toISOString(),
                                  text: logText,
                                  type: logType
                                };
                                
                                // Prepare updated logs array
                                const updatedLogs = projectDetails.logs && Array.isArray(projectDetails.logs) 
                                  ? [...projectDetails.logs, newLog]
                                  : [newLog];
                                
                                // Update the project with the new log
                                fetch(`/api/projects/${selectedProject}`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    logs: updatedLogs
                                  }),
                                })
                                .then(response => {
                                  if (!response.ok) throw new Error('Failed to add log');
                                  return response.json();
                                })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProject] });
                                  toast({
                                    title: "Log added",
                                    description: "New progress log has been added successfully",
                                  });
                                  
                                  // Reset form and close dialog
                                  setLogText("");
                                  setLogType("note");
                                  setAddLogOpen(false);
                                })
                                .catch(error => {
                                  console.error('Error adding log:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to add log. Please try again.",
                                    variant: "destructive",
                                  });
                                });
                              }}
                            >
                              Add Log Entry
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
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