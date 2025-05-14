import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { CalendarIcon, FileTextIcon, ClockIcon, ChevronLeft, Calendar, Download, Trash2, RefreshCw } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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

const ProjectReports = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpenNewReportDialog, setIsOpenNewReportDialog] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date()
  });
  
  // Form for new report
  const form = useForm({
    defaultValues: {
      report_type: 'custom',
      includes_photos: true,
      includes_notes: true,
    }
  });
  
  // Form for report settings
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
  
  // Query project
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: () => apiRequest(`/api/projects/${projectId}`),
    enabled: !!projectId,
  });
  
  // Query project reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/projects', projectId, 'reports'],
    queryFn: () => apiRequest(`/api/projects/${projectId}/reports`),
    enabled: !!projectId,
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
        description: 'Report settings have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update report settings.',
        variant: 'destructive',
      });
    }
  });
  
  // Create new report
  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/projects/${projectId}/reports`, {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: 'Report created',
        description: 'New report has been created successfully.',
      });
      setIsOpenNewReportDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'reports'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create new report.',
        variant: 'destructive',
      });
    }
  });
  
  // Generate PDF for a report
  const generatePdfMutation = useMutation({
    mutationFn: async (reportId: number) => {
      setIsGenerating(true);
      return apiRequest(`/api/projects/${projectId}/reports/${reportId}/generate-pdf`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'PDF Generated',
        description: 'Report PDF has been generated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'reports'] });
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report.',
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  });
  
  // Delete a report
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest(`/api/projects/${projectId}/reports/${reportId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Report deleted',
        description: 'Report has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'reports'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete report.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle saving report settings
  const onSaveSettings = (data: any) => {
    updateProjectMutation.mutate({
      reportSettings: data.reportSettings
    });
  };
  
  // Handle creating a new report
  const onCreateReport = (data: any) => {
    createReportMutation.mutate({
      report_type: data.report_type,
      start_date: dateRange.from,
      end_date: dateRange.to,
      includes_photos: data.includes_photos,
      includes_notes: data.includes_notes
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
  
  if (isLoadingProject) {
    return (
      <div className="container p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div className="container p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Link href={`/project-tracker/${projectId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Project
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{project?.name} - Reports</h1>
        </div>
        <Dialog open={isOpenNewReportDialog} onOpenChange={setIsOpenNewReportDialog}>
          <DialogTrigger asChild>
            <Button>
              <FileTextIcon className="h-4 w-4 mr-2" />
              Generate New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Create a new project report for a specific time period.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateReport)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="report_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full p-2 border rounded"
                          {...field}
                        >
                          <option value="custom">Custom</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
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
                    control={form.control}
                    name="includes_photos"
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
                    control={form.control}
                    name="includes_notes"
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
                  <Button type="submit" disabled={createReportMutation.isPending}>
                    {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Report Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-6">
          {isLoadingReports ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : reports && reports.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Project Reports</CardTitle>
                <CardDescription>
                  View and manage reports for {project?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                                  <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this report? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteReportMutation.mutate(report.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Reports Yet</CardTitle>
                <CardDescription>
                  This project doesn't have any reports generated yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <FileTextIcon className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Click "Generate New Report" to create your first project report.
                  </p>
                  <Button
                    onClick={() => setIsOpenNewReportDialog(true)}
                  >
                    Generate New Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
              <CardDescription>
                Configure how reports are generated for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-6">
                  <div className="flex items-center justify-between py-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automatic Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automatic weekly generation of project reports
                      </p>
                    </div>
                    <FormField
                      control={settingsForm.control}
                      name="reportSettings.autoGenerate"
                      render={({ field }) => (
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <Label className="text-base">Report Frequency</Label>
                    <FormField
                      control={settingsForm.control}
                      name="reportSettings.frequency"
                      render={({ field }) => (
                        <FormControl>
                          <select 
                            className="w-full p-2 border rounded"
                            {...field}
                            disabled={!settingsForm.watch("reportSettings.autoGenerate")}
                          >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </FormControl>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <Label className="text-base">Report Content</Label>
                    <div className="flex space-x-6">
                      <FormField
                        control={settingsForm.control}
                        name="reportSettings.includePhotos"
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
                        control={settingsForm.control}
                        name="reportSettings.includeNotes"
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
                  </div>
                  
                  <Button type="submit" disabled={updateProjectMutation.isPending}>
                    {updateProjectMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectReports;