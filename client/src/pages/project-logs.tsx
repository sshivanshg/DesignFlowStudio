import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
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
  Calendar,
  ClipboardList, 
  Clock, 
  Download,
  FileText, 
  Info,
  ImageIcon,
  Layers,
  LineChart,
  List, 
  MessageSquare, 
  Plus, 
  Search,
  AlertTriangle,
  Upload
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

type LogFormValues = z.infer<typeof logEntrySchema>;
type ReportFormValues = z.infer<typeof reportSchema>;

export default function ProjectLogs() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [view, setView] = useState<string>('logs');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isAddLogDialogOpen, setIsAddLogDialogOpen] = useState(false);
  const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form setup for log entry
  const logForm = useForm<LogFormValues>({
    resolver: zodResolver(logEntrySchema),
    defaultValues: {
      text: "",
      type: "note",
    },
  });
  
  // Form setup for report generation
  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "weekly",
      includePhotos: true,
      includeNotes: true,
    },
  });
  
  // Create log entry mutation
  const addLogMutation = useMutation({
    mutationFn: (data: LogFormValues) => {
      return apiRequest("POST", `/api/project-logs`, {
        ...data,
        project_id: parseInt(selectedProject),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/project-logs/${selectedProject}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Log Added",
        description: "Project log entry has been added successfully.",
      });
      setIsAddLogDialogOpen(false);
      logForm.reset();
    },
    onError: (error) => {
      console.error("Log entry error:", error);
      toast({
        title: "Error",
        description: "Failed to add log entry. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (data: ReportFormValues) => {
      return apiRequest("POST", `/api/project-reports`, {
        project_id: parseInt(selectedProject),
        report_type: data.reportType,
        start_date: data.startDate,
        end_date: data.endDate,
        includes_photos: data.includePhotos,
        includes_notes: data.includeNotes
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/project-reports/${selectedProject}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Report Generated",
        description: "Project report has been generated successfully.",
      });
      
      // Open the report PDF in a new window if available
      if (data?.pdf_url) {
        window.open(`/api/project-reports/${data.id}/pdf`, '_blank');
      }
      
      setIsGenerateReportDialogOpen(false);
      reportForm.reset();
    },
    onError: (error) => {
      console.error("Report generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handlers for form submissions
  const handleAddLog = (values: LogFormValues) => {
    addLogMutation.mutate(values);
  };
  
  const handleGenerateReport = (values: ReportFormValues) => {
    generateReportMutation.mutate(values);
  };

  // Fetch projects data
  const { isLoading: projectsLoading, error: projectsError, data: projects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      return fetch('/api/projects').then(res => res.json());
    },
  });
  
  // Fetch project logs based on selected project
  const { 
    isLoading: logsLoading, 
    error: logsError, 
    data: projectLogs 
  } = useQuery({
    queryKey: [`/api/project-logs/${selectedProject}`],
    queryFn: async () => {
      if (!selectedProject) return [];
      return fetch(`/api/project-logs/${selectedProject}`).then(res => res.json());
    },
    enabled: !!selectedProject,
  });
  
  // Fetch project reports based on selected project
  const { 
    isLoading: reportsLoading, 
    error: reportsError, 
    data: projectReports 
  } = useQuery({
    queryKey: [`/api/project-reports/${selectedProject}`],
    queryFn: async () => {
      if (!selectedProject) return [];
      return fetch(`/api/project-reports/${selectedProject}`).then(res => res.json());
    },
    enabled: !!selectedProject,
  });

  // Filter logs based on selected project and search query
  const filteredLogs = projectLogs ? projectLogs.filter(log => {
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
  }) : [];

  // Filter reports based on selected project
  const filteredReports = projectReports || [];

  // Get room options from mock or real data
  const getRoomOptions = () => {
    // In real implementation, this would fetch rooms from the selected project
    return [
      { id: "living", label: "Living Room" },
      { id: "kitchen", label: "Kitchen" },
      { id: "master", label: "Master Bedroom" },
      { id: "bathroom", label: "Bathroom" },
      { id: "general", label: "General" },
    ];
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Project Logs & Reports</h1>
          <p className="text-gray-500 mt-1">Track daily progress, document changes, and generate reports</p>
        </div>
        {selectedProject && (
          <div className="flex space-x-2">
            <Button onClick={() => setIsAddLogDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Log Entry
            </Button>
            <Button variant="outline" onClick={() => setIsGenerateReportDialogOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        )}
      </div>
      
      {/* Add Log Entry Dialog */}
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
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                                  onClick={() => {
                                    if (field.value && field.value.startsWith('blob:')) {
                                      URL.revokeObjectURL(field.value);
                                    }
                                    field.onChange("");
                                    logForm.setValue('photoCaption', "");
                                  }}
                                >
                                  &times;
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload a photo showing progress or issues
                        </FormDescription>
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
                            placeholder="Add a caption for the photo"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddLogDialogOpen(false);
                    logForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addLogMutation.isPending}
                >
                  {addLogMutation.isPending ? "Adding..." : "Add Log Entry"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Generate Report Dialog */}
      <Dialog open={isGenerateReportDialogOpen} onOpenChange={setIsGenerateReportDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Generate Project Report</DialogTitle>
            <DialogDescription>
              Create a report summarizing project progress and activities.
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Weekly Report</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="monthly">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Monthly Report</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Custom Date Range</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {reportForm.watch("reportType") === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={reportForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Button
                          type="button"
                          variant={"outline"}
                          className={
                            !field.value ? "text-muted-foreground" : ""
                          }
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={reportForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Button
                          type="button"
                          variant={"outline"}
                          className={
                            !field.value ? "text-muted-foreground" : ""
                          }
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="space-y-3 pt-2">
                <FormField
                  control={reportForm.control}
                  name="includePhotos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Include Photos</FormLabel>
                        <FormDescription>
                          Add project photos to the report
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
                
                <FormField
                  control={reportForm.control}
                  name="includeNotes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Include Notes</FormLabel>
                        <FormDescription>
                          Add log notes and comments to the report
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
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsGenerateReportDialogOpen(false);
                    reportForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={generateReportMutation.isPending}
                >
                  {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Select a project to view logs</CardDescription>
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
                        <Info className="h-3 w-3 mr-1" />
                        {project.client}
                      </div>
                    </div>
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

        {/* Project Logs & Reports */}
        <div className="lg:col-span-3 space-y-6">
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
                        Client: {mockProjects.find(p => p.id.toString() === selectedProject)?.client || 'Client'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="logs" value={view} onValueChange={setView}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="logs">
                        <List className="h-4 w-4 mr-2" />
                        Daily Logs
                      </TabsTrigger>
                      <TabsTrigger value="reports">
                        <FileText className="h-4 w-4 mr-2" />
                        Reports
                      </TabsTrigger>
                      <TabsTrigger value="analytics">
                        <LineChart className="h-4 w-4 mr-2" />
                        Analytics
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="logs">
                      <div className="flex justify-between items-center mb-4 gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search logs..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select 
                          value={dateFilter} 
                          onValueChange={setDateFilter}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Date Range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Dates</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4 mt-4">
                        {filteredLogs.length > 0 ? (
                          filteredLogs.map((log) => (
                            <Card key={log.id} className="overflow-hidden">
                              <CardHeader className="pb-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={log.type === 'photo' ? 'default' : 'outline'}>
                                        {log.type === 'photo' ? (
                                          <><ImageIcon className="h-3 w-3 mr-1" /> Photo</>
                                        ) : (
                                          <><MessageSquare className="h-3 w-3 mr-1" /> Note</>
                                        )}
                                      </Badge>
                                      <Badge variant="outline">{log.roomName}</Badge>
                                    </div>
                                    <CardTitle className="text-base">{log.title}</CardTitle>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {format(log.date, 'MMM d, yyyy')}
                                      <span className="mx-2">•</span>
                                      <span>{log.creator}</span>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pb-3 pt-3">
                                <p className="text-sm text-gray-700">{log.description}</p>
                                {log.type === 'photo' && log.images.length > 0 && (
                                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                    {log.images.map((image, index) => (
                                      <div 
                                        key={index} 
                                        className="w-24 h-24 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0"
                                      >
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <List className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-700">No logs found</h3>
                            <p className="text-gray-500 text-center max-w-md mx-auto mt-1">
                              There are no log entries matching your search criteria.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="reports">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Project Reports</h3>
                      </div>
                      {filteredReports.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Report</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredReports.map((report) => (
                              <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.title}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {report.type === 'weekly' ? 'Weekly' : 'Monthly'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{format(report.date, 'MMM d, yyyy')}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-700">No reports available</h3>
                          <p className="text-gray-500 text-center max-w-md mx-auto mt-1">
                            There are no reports generated for this project yet.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="analytics">
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800">Coming Soon</h4>
                            <p className="text-sm text-amber-700">
                              Project analytics feature is under development and will be available soon.
                              This feature will provide insights into project progress, task completion rates, and more.
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
                <List className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No Project Selected</h3>
                <p className="text-gray-500 text-center max-w-md mt-1">
                  Select a project from the list to view logs, reports, and analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}