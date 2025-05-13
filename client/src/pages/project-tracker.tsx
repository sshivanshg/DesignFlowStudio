import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderOpen, Calendar, CheckSquare, Clock, MoreHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ProjectTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [_, navigate] = useLocation();
  
  // Fetch projects
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });
  
  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate days remaining or overdue
  const getDaysStatus = (endDate: string | null) => {
    if (!endDate) return { days: null, isOverdue: false };
    
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: Math.abs(diffDays),
      isOverdue: diffDays < 0
    };
  };
  
  // Project card component
  const ProjectCard = ({ project }: { project: any }) => {
    const daysStatus = getDaysStatus(project.endDate);
    
    // Count tasks by status
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "done").length;
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Count rooms
    const rooms = Array.isArray(project.rooms) ? project.rooms : [];
    
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/project/${project.id}`)}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {project.client?.name || "No client assigned"}
              </p>
            </div>
            <Badge 
              className={cn(
                "capitalize",
                project.status === "completed" && "bg-green-100 text-green-800",
                project.status === "in_progress" && "bg-blue-100 text-blue-800",
                project.status === "planning" && "bg-yellow-100 text-yellow-800",
                project.status === "on_hold" && "bg-gray-100 text-gray-800",
              )}
            >
              {project.status?.replace("_", " ") || "No status"}
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Progress</span>
                <span className="text-sm font-medium">{project.progress || 0}%</span>
              </div>
              <Progress value={project.progress || 0} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <FolderOpen className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm">{rooms.length} Rooms</span>
              </div>
              <div className="flex items-center">
                <CheckSquare className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm">{completedTasks}/{totalTasks} Tasks</span>
              </div>
              {daysStatus.days !== null && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className={cn(
                    "text-sm",
                    daysStatus.isOverdue ? "text-red-600" : "text-gray-600"
                  )}>
                    {daysStatus.isOverdue 
                      ? `${daysStatus.days} days overdue` 
                      : `${daysStatus.days} days left`}
                  </span>
                </div>
              )}
              {project.location && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{project.location}</span>
                </div>
              )}
            </div>
            
            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Tracker</h1>
        <p className="text-gray-500">Track project progress, rooms, tasks, and daily logs</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate("/project/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                {searchQuery 
                  ? `No projects matching "${searchQuery}"` 
                  : "Create your first project to track progress and tasks."}
              </p>
              <Button className="mx-auto" onClick={() => navigate("/project/new")}>
                <Plus className="mr-2 h-4 w-4" /> Create New Project
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : filteredProjects && filteredProjects.filter(p => p.status === "in_progress").length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects
                .filter(p => p.status === "in_progress")
                .map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              }
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No active projects</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                There are no projects currently in progress.
              </p>
            </Card>
          )}
        </TabsContent>
        
        {/* Planning tab */}
        <TabsContent value="planning">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : filteredProjects && filteredProjects.filter(p => p.status === "planning").length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects
                .filter(p => p.status === "planning")
                .map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              }
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No planning projects</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                There are no projects currently in the planning phase.
              </p>
            </Card>
          )}
        </TabsContent>
        
        {/* Completed tab */}
        <TabsContent value="completed">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : filteredProjects && filteredProjects.filter(p => p.status === "completed").length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects
                .filter(p => p.status === "completed")
                .map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              }
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No completed projects</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                There are no completed projects yet.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}