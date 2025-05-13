import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger, 
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Users, 
  LayoutTemplate, 
  Settings, 
  BarChart4, 
  Plus, 
  Trash, 
  Save, 
  Edit, 
  ChevronRight, 
  Briefcase, 
  FileText, 
  PaintBucket, 
  Calculator,
  MessageSquareText,
  ClipboardList
} from "lucide-react";

type CompanySettings = {
  id: number;
  name: string;
  logo?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  enabledFeatures: {
    crm: boolean;
    proposals: boolean;
    moodboards: boolean;
    estimates: boolean;
    whatsapp: boolean;
    tasks: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: number;
  fullName: string;
  email: string;
  role: "admin" | "designer" | "sales";
  activePlan: string | null;
  createdAt: string;
  lastLogin: string | null;
};

type TemplateCategory = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type Template = {
  id: number;
  name: string;
  type: string;
  categoryId: number;
  description: string | null;
  content: any;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type Analytics = {
  id: number;
  metric: string;
  date: string;
  value: number;
  metadata: any;
  createdAt: string;
};

// Form schemas
const companySettingsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logo: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().url().nullable().optional(),
  enabledFeatures: z.object({
    crm: z.boolean(),
    proposals: z.boolean(),
    moodboards: z.boolean(),
    estimates: z.boolean(),
    whatsapp: z.boolean(),
    tasks: z.boolean(),
  }),
});

const userSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "designer", "sales"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const templateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().nullable().optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Type is required"),
  categoryId: z.number().int().positive(),
  description: z.string().nullable().optional(),
  content: z.any(),
  isDefault: z.boolean(),
});

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState("company");

  // State for edit modes
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);

  // State for creation modes
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // State for template type filtering
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>("all");

  // Company Settings query and mutation
  const { 
    data: companySettings, 
    isLoading: isLoadingSettings,
    isError: isErrorSettings,
    refetch: refetchSettings
  } = useQuery({ 
    queryKey: ['/api/admin/company-settings'],
    enabled: !!user && user.role === 'admin'
  });

  const { mutate: updateCompanySettings } = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', '/api/admin/company-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-settings'] });
      toast({
        title: "Settings updated",
        description: "Company settings have been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update company settings",
        variant: "destructive"
      });
    }
  });

  // Users query and mutations
  const { 
    data: users, 
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers
  } = useQuery({ 
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin' && activeTab === "users"
  });

  const { mutate: createUser } = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setCreatingUser(false);
      toast({
        title: "User created",
        description: "New user has been created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  });

  const { mutate: updateUser } = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest('PUT', `/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingUser(null);
      toast({
        title: "User updated",
        description: "User has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  // Template Categories query and mutations
  const { 
    data: templateCategories, 
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    refetch: refetchCategories
  } = useQuery({ 
    queryKey: ['/api/admin/template-categories', templateTypeFilter],
    queryFn: () => {
      const endpoint = templateTypeFilter === 'all' 
        ? '/api/admin/template-categories'
        : `/api/admin/template-categories?type=${templateTypeFilter}`;
      return apiRequest('GET', endpoint);
    },
    enabled: !!user && user.role === 'admin' && activeTab === "templates"
  });

  const { mutate: createTemplateCategory } = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/template-categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
      setCreatingCategory(false);
      toast({
        title: "Category created",
        description: "New template category has been created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create template category",
        variant: "destructive"
      });
    }
  });

  const { mutate: updateTemplateCategory } = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest('PUT', `/api/admin/template-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
      setEditingCategory(null);
      toast({
        title: "Category updated",
        description: "Template category has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update template category",
        variant: "destructive"
      });
    }
  });

  const { mutate: deleteTemplateCategory } = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/template-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
      toast({
        title: "Category deleted",
        description: "Template category has been deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete template category",
        variant: "destructive"
      });
    }
  });

  // Templates query and mutations
  const { 
    data: templates, 
    isLoading: isLoadingTemplates,
    isError: isErrorTemplates,
    refetch: refetchTemplates
  } = useQuery({ 
    queryKey: ['/api/admin/templates', templateTypeFilter],
    queryFn: () => {
      const endpoint = templateTypeFilter === 'all' 
        ? '/api/admin/templates'
        : `/api/admin/templates?type=${templateTypeFilter}`;
      return apiRequest('GET', endpoint);
    },
    enabled: !!user && user.role === 'admin' && activeTab === "templates"
  });

  const { mutate: createTemplate } = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
      setCreatingTemplate(false);
      toast({
        title: "Template created",
        description: "New template has been created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  });

  const { mutate: updateTemplate } = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest('PUT', `/api/admin/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
      setEditingTemplate(null);
      toast({
        title: "Template updated",
        description: "Template has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update template",
        variant: "destructive"
      });
    }
  });

  const { mutate: deleteTemplate } = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
      toast({
        title: "Template deleted",
        description: "Template has been deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  });

  const { mutate: setDefaultTemplate } = useMutation({
    mutationFn: ({ id, type }: { id: number, type: string }) => apiRequest('POST', `/api/admin/templates/${id}/set-default`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/templates'] });
      toast({
        title: "Default set",
        description: "Default template has been set successfully"
      });
    },
    onError: () => {
      toast({
        title: "Operation failed",
        description: "Failed to set default template",
        variant: "destructive"
      });
    }
  });

  // Analytics query
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics,
    isError: isErrorAnalytics,
    refetch: refetchAnalytics
  } = useQuery({ 
    queryKey: ['/api/admin/analytics'],
    enabled: !!user && user.role === 'admin' && activeTab === "analytics"
  });

  // Forms setup
  const companySettingsForm = useForm<z.infer<typeof companySettingsSchema>>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: companySettings?.name || "My Company",
      logo: companySettings?.logo || null,
      address: companySettings?.address || null,
      phone: companySettings?.phone || null,
      email: companySettings?.email || null,
      website: companySettings?.website || null,
      enabledFeatures: companySettings?.enabledFeatures || {
        crm: true,
        proposals: true,
        moodboards: true,
        estimates: true,
        whatsapp: true,
        tasks: true,
      }
    }
  });

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "designer",
      password: "",
    }
  });

  const templateCategoryForm = useForm<z.infer<typeof templateCategorySchema>>({
    resolver: zodResolver(templateCategorySchema),
    defaultValues: {
      name: "",
      type: "proposal",
      description: null,
    }
  });

  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      type: "proposal",
      categoryId: 0,
      description: null,
      content: {},
      isDefault: false,
    }
  });

  // Form submission handlers
  const onSubmitCompanySettings = (data: z.infer<typeof companySettingsSchema>) => {
    updateCompanySettings(data);
  };

  const onSubmitUser = (data: z.infer<typeof userSchema>) => {
    if (editingUser) {
      updateUser({ id: editingUser, data });
    } else {
      createUser(data);
    }
  };

  const onSubmitTemplateCategory = (data: z.infer<typeof templateCategorySchema>) => {
    if (editingCategory) {
      updateTemplateCategory({ id: editingCategory, data });
    } else {
      createTemplateCategory(data);
    }
  };

  const onSubmitTemplate = (data: z.infer<typeof templateSchema>) => {
    if (editingTemplate) {
      updateTemplate({ id: editingTemplate, data });
    } else {
      createTemplate(data);
    }
  };

  // Error state
  if ((isErrorSettings && activeTab === "company") || 
      (isErrorUsers && activeTab === "users") || 
      (isErrorCategories && activeTab === "templates") || 
      (isErrorTemplates && activeTab === "templates") || 
      (isErrorAnalytics && activeTab === "analytics")) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-800">Error Loading Data</h3>
          <p className="text-red-600">There was an error loading the admin dashboard data. Please try refreshing the page.</p>
          <Button 
            onClick={() => {
              switch(activeTab) {
                case "company": refetchSettings(); break;
                case "users": refetchUsers(); break;
                case "templates": 
                  refetchCategories();
                  refetchTemplates();
                  break;
                case "analytics": refetchAnalytics(); break;
              }
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Access control - only allow admins
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800">Access Restricted</h3>
          <p className="text-yellow-600">You need administrator privileges to access this section.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage company settings, users, templates, and view analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="company" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Company Settings
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center">
            <LayoutTemplate className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart4 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>Manage your company information and enabled features</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Form {...companySettingsForm}>
                  <form onSubmit={companySettingsForm.handleSubmit(onSubmitCompanySettings)} className="space-y-6">
                    <FormField
                      control={companySettingsForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companySettingsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companySettingsForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Phone</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companySettingsForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={companySettingsForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Enabled Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={companySettingsForm.control}
                          name="enabledFeatures.crm"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Briefcase className="w-5 h-5 mr-2 text-gray-500" />
                                  CRM
                                </FormLabel>
                                <FormDescription>
                                  Access to lead and client management features
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
                          control={companySettingsForm.control}
                          name="enabledFeatures.proposals"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <FileText className="w-5 h-5 mr-2 text-gray-500" />
                                  Proposals
                                </FormLabel>
                                <FormDescription>
                                  Create and manage client proposals
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
                          control={companySettingsForm.control}
                          name="enabledFeatures.moodboards"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <PaintBucket className="w-5 h-5 mr-2 text-gray-500" />
                                  Moodboards
                                </FormLabel>
                                <FormDescription>
                                  Create and share project moodboards
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
                          control={companySettingsForm.control}
                          name="enabledFeatures.estimates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Calculator className="w-5 h-5 mr-2 text-gray-500" />
                                  Estimates
                                </FormLabel>
                                <FormDescription>
                                  Generate detailed project estimates
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
                          control={companySettingsForm.control}
                          name="enabledFeatures.whatsapp"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <MessageSquareText className="w-5 h-5 mr-2 text-gray-500" />
                                  WhatsApp
                                </FormLabel>
                                <FormDescription>
                                  Send client communications via WhatsApp
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
                          control={companySettingsForm.control}
                          name="enabledFeatures.tasks"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <ClipboardList className="w-5 h-5 mr-2 text-gray-500" />
                                  Task Management
                                </FormLabel>
                                <FormDescription>
                                  Track project tasks and progress
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
                    </div>

                    <Button type="submit" className="w-full md:w-auto">
                      Save Settings
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Add, edit, or remove users from your account</CardDescription>
              </div>
              <Button onClick={() => {
                userForm.reset({
                  fullName: "",
                  email: "",
                  role: "designer",
                  password: ""
                });
                setEditingUser(null);
                setCreatingUser(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : creatingUser || editingUser ? (
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="designer">Designer</SelectItem>
                              <SelectItem value="sales">Sales Manager</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {!editingUser && (
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="flex space-x-2 justify-end pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setCreatingUser(false);
                          setEditingUser(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingUser ? "Update User" : "Create User"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : users && users.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {users.map((user: User) => (
                      <Card key={user.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between p-4">
                            <div className="space-y-1">
                              <h4 className="text-base font-medium">{user.fullName}</h4>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <Badge variant={
                                  user.role === 'admin' ? 'default' :
                                  user.role === 'designer' ? 'secondary' : 'outline'
                                }>
                                  {user.role}
                                </Badge>
                              </div>
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <span>Added: {format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                                {user.lastLogin && (
                                  <span className="ml-3">Last login: {format(new Date(user.lastLogin), 'MMM dd, yyyy')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  const selectedUser = users.find((u: User) => u.id === user.id);
                                  if (selectedUser) {
                                    userForm.reset({
                                      fullName: selectedUser.fullName,
                                      email: selectedUser.email,
                                      role: selectedUser.role
                                    });
                                    setCreatingUser(false);
                                    setEditingUser(user.id);
                                  }
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash className="w-4 h-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.fullName}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteUser(user.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-md p-8 text-center">
                  <Users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-gray-600 font-medium mb-1">No Users Found</h3>
                  <p className="text-gray-500 text-sm mb-4">Start by adding a new team member to your account.</p>
                  <Button 
                    onClick={() => {
                      userForm.reset({
                        fullName: "",
                        email: "",
                        role: "designer",
                        password: ""
                      });
                      setEditingUser(null);
                      setCreatingUser(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Template Type Selection */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Template Types</CardTitle>
                <CardDescription>Select a template type to manage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant={templateTypeFilter === "all" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setTemplateTypeFilter("all")}
                  >
                    <LayoutTemplate className="w-4 h-4 mr-2" />
                    All Templates
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button 
                    variant={templateTypeFilter === "proposal" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setTemplateTypeFilter("proposal")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Proposal Templates
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button 
                    variant={templateTypeFilter === "moodboard" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setTemplateTypeFilter("moodboard")}
                  >
                    <PaintBucket className="w-4 h-4 mr-2" />
                    Moodboard Templates
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  <Button 
                    variant={templateTypeFilter === "estimate" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setTemplateTypeFilter("estimate")}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Estimate Templates
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Template Categories and Templates */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Template Management</CardTitle>
                  <CardDescription>Manage template categories and templates</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      templateCategoryForm.reset({
                        name: "",
                        type: templateTypeFilter === "all" ? "proposal" : templateTypeFilter,
                        description: null
                      });
                      setEditingCategory(null);
                      setCreatingCategory(true);
                      setCreatingTemplate(false);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                  <Button
                    onClick={() => {
                      templateForm.reset({
                        name: "",
                        type: templateTypeFilter === "all" ? "proposal" : templateTypeFilter,
                        categoryId: templateCategories?.[0]?.id || 0,
                        description: null,
                        content: {},
                        isDefault: false
                      });
                      setEditingTemplate(null);
                      setCreatingTemplate(true);
                      setCreatingCategory(false);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCategories || isLoadingTemplates ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : creatingCategory || editingCategory ? (
                  <Form {...templateCategoryForm}>
                    <form onSubmit={templateCategoryForm.handleSubmit(onSubmitTemplateCategory)} className="space-y-4">
                      <FormField
                        control={templateCategoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateCategoryForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="moodboard">Moodboard</SelectItem>
                                <SelectItem value="estimate">Estimate</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateCategoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex space-x-2 justify-end pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setCreatingCategory(false);
                            setEditingCategory(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingCategory ? "Update Category" : "Create Category"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : creatingTemplate || editingTemplate ? (
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-4">
                      <FormField
                        control={templateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Type</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                // When type changes, we need to update the available categories
                                field.onChange(value);
                                if (templateCategories) {
                                  const filteredCategories = templateCategories.filter(
                                    (cat: TemplateCategory) => cat.type === value
                                  );
                                  if (filteredCategories.length > 0) {
                                    templateForm.setValue("categoryId", filteredCategories[0].id);
                                  }
                                }
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="moodboard">Moodboard</SelectItem>
                                <SelectItem value="estimate">Estimate</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templateCategories
                                  ?.filter((cat: TemplateCategory) => 
                                    cat.type === templateForm.getValues("type")
                                  )
                                  .map((category: TemplateCategory) => (
                                    <SelectItem 
                                      key={category.id} 
                                      value={category.id.toString()}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={templateForm.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Default Template</FormLabel>
                              <FormDescription>
                                Make this the default template for its type
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
                      
                      <div className="flex space-x-2 justify-end pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setCreatingTemplate(false);
                            setEditingTemplate(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingTemplate ? "Update Template" : "Create Template"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : templateCategories && templateCategories.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <Accordion type="multiple" className="w-full">
                      {templateCategories.map((category: TemplateCategory) => (
                        <AccordionItem key={category.id} value={category.id.toString()}>
                          <AccordionTrigger className="hover:bg-gray-50 px-4 group">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{category.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {category.type}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    templateCategoryForm.reset({
                                      name: category.name,
                                      type: category.type,
                                      description: category.description
                                    });
                                    setCreatingCategory(false);
                                    setCreatingTemplate(false);
                                    setEditingCategory(category.id);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this category? This will also delete all templates in this category.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => deleteTemplateCategory(category.id)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="py-2 px-4 space-y-4">
                              {category.description && (
                                <p className="text-sm text-gray-500 italic">{category.description}</p>
                              )}
                              
                              <div className="space-y-3">
                                {templates
                                  ?.filter((template: Template) => template.categoryId === category.id)
                                  .map((template: Template) => (
                                    <Card key={template.id} className="overflow-hidden">
                                      <CardContent className="p-0">
                                        <div className="flex items-center justify-between p-4">
                                          <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <h4 className="text-base font-medium">{template.name}</h4>
                                              {template.isDefault && (
                                                <Badge>Default</Badge>
                                              )}
                                            </div>
                                            {template.description && (
                                              <p className="text-sm text-gray-500">{template.description}</p>
                                            )}
                                            <p className="text-xs text-gray-400">
                                              Updated: {format(new Date(template.updatedAt), 'MMM dd, yyyy')}
                                            </p>
                                          </div>
                                          <div className="flex space-x-2">
                                            {!template.isDefault && (
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setDefaultTemplate({
                                                  id: template.id,
                                                  type: template.type
                                                })}
                                              >
                                                Set as Default
                                              </Button>
                                            )}
                                            
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={() => {
                                                templateForm.reset({
                                                  name: template.name,
                                                  type: template.type,
                                                  categoryId: template.categoryId,
                                                  description: template.description,
                                                  content: template.content,
                                                  isDefault: template.isDefault
                                                });
                                                setCreatingTemplate(false);
                                                setEditingTemplate(template.id);
                                              }}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                  <Trash className="w-4 h-4 text-red-500" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Are you sure you want to delete this template? This action cannot be undone.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction 
                                                    onClick={() => deleteTemplate(template.id)}
                                                    className="bg-red-500 hover:bg-red-600"
                                                  >
                                                    Delete
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                                }
                                
                                {!templates || templates.filter((template: Template) => template.categoryId === category.id).length === 0 ? (
                                  <div className="bg-gray-50 rounded-md p-4 text-center">
                                    <p className="text-gray-500 text-sm">No templates in this category</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2"
                                      onClick={() => {
                                        templateForm.reset({
                                          name: "",
                                          type: category.type,
                                          categoryId: category.id,
                                          description: null,
                                          content: {},
                                          isDefault: false
                                        });
                                        setEditingTemplate(null);
                                        setCreatingTemplate(true);
                                      }}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Template
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-md p-8 text-center">
                    <LayoutTemplate className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-gray-600 font-medium mb-1">No Template Categories Found</h3>
                    <p className="text-gray-500 text-sm mb-4">Start by adding a new template category.</p>
                    <Button 
                      onClick={() => {
                        templateCategoryForm.reset({
                          name: "",
                          type: templateTypeFilter === "all" ? "proposal" : templateTypeFilter,
                          description: null
                        });
                        setEditingCategory(null);
                        setCreatingCategory(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Account Analytics</CardTitle>
              <CardDescription>View your account usage and activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : analytics && analytics.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-500">Total Users</p>
                          <h3 className="text-3xl font-bold mt-1">{users?.length || 0}</h3>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-500">Active Projects</p>
                          <h3 className="text-3xl font-bold mt-1">
                            {analytics.find((a: Analytics) => a.metric === 'active_projects')?.value || 0}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-500">Total Clients</p>
                          <h3 className="text-3xl font-bold mt-1">
                            {analytics.find((a: Analytics) => a.metric === 'total_clients')?.value || 0}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-500">Proposals Created</p>
                          <h3 className="text-3xl font-bold mt-1">
                            {analytics.find((a: Analytics) => a.metric === 'proposals_created')?.value || 0}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                    <div className="space-y-2">
                      {analytics
                        .filter((a: Analytics) => a.metric === 'recent_activity')
                        .sort((a: Analytics, b: Analytics) => 
                          new Date(b.date).getTime() - new Date(a.date).getTime()
                        )
                        .slice(0, 5)
                        .map((activity: Analytics) => (
                          <div key={activity.id} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm">{activity.metadata?.description || 'Activity recorded'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {activity.metadata?.user || 'System'} • {format(new Date(activity.date), 'MMM dd, yyyy HH:mm')}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {activity.metadata?.type || 'action'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-4">Feature Usage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Proposals Created</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-8 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${Math.min(100, analytics.find((a: Analytics) => 
                                  a.metric === 'proposals_created_percent')?.value || 0)}%` 
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <span>{analytics.find((a: Analytics) => a.metric === 'proposals_created')?.value || 0} created</span>
                            <span>{analytics.find((a: Analytics) => a.metric === 'proposals_created_percent')?.value || 0}% of capacity</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">WhatsApp Messages</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-8 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${Math.min(100, analytics.find((a: Analytics) => 
                                  a.metric === 'whatsapp_messages_percent')?.value || 0)}%` 
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <span>{analytics.find((a: Analytics) => a.metric === 'whatsapp_messages')?.value || 0} sent</span>
                            <span>{analytics.find((a: Analytics) => a.metric === 'whatsapp_messages_percent')?.value || 0}% of limit</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-md p-8 text-center">
                  <BarChart4 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-gray-600 font-medium mb-1">No Analytics Data Available</h3>
                  <p className="text-gray-500 text-sm mb-4">Analytics data will appear as your team uses the platform.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}