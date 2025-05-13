import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, User as UserIcon, Building, BellRing, Key, LogOut, Database, Terminal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const profileFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().optional(),
  role: z.enum(["admin", "designer", "sales"])
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Seed estimate config mutation
  const seedEstimateConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/seed/estimate-configs", {});
    },
    onSuccess: () => {
      toast({
        title: "Database seeded successfully",
        description: "Estimate configurations have been added to the database",
      });
      // Invalidate any queries that might use the estimate configs
      queryClient.invalidateQueries({ queryKey: ["/api/estimate-configs"] });
    },
    onError: (error) => {
      toast({
        title: "Seeding failed",
        description: error instanceof Error ? error.message : "Failed to seed the database",
        variant: "destructive",
      });
    }
  });

  // Profile form with proper initialization
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      company: user?.company || "",
      role: (user?.role as "admin" | "designer" | "sales") || "designer"
    },
  });
  
  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        company: user.company || "",
        role: (user.role as "admin" | "designer" | "sales") || "designer"
      });
    }
  }, [user, profileForm]);

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user) return null;
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string, newPassword: string }) => {
      if (!user) return null;
      const response = await apiRequest("POST", `/api/auth/change-password`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to change password",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.clear();
      logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar || ""} alt={user?.fullName} />
                  <AvatarFallback className="text-xl bg-primary text-white">
                    {user?.fullName?.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-medium text-lg">{user.fullName}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
            <TabsList className="flex flex-col h-auto items-stretch bg-transparent space-y-1 p-0">
              <TabsTrigger 
                value="profile" 
                className="justify-start px-3 py-2 h-auto data-[state=active]:bg-muted"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="justify-start px-3 py-2 h-auto data-[state=active]:bg-muted"
              >
                <Key className="mr-2 h-4 w-4" />
                Password
              </TabsTrigger>
              <TabsTrigger 
                value="company" 
                className="justify-start px-3 py-2 h-auto data-[state=active]:bg-muted"
              >
                <Building className="mr-2 h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="justify-start px-3 py-2 h-auto data-[state=active]:bg-muted"
              >
                <BellRing className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="justify-start px-3 py-2 h-auto data-[state=active]:bg-muted"
              >
                <Shield className="mr-2 h-4 w-4" />
                Security
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="developer" 
                  className="justify-start px-3 py-2 h-auto data-[state=active]:bg-muted"
                >
                  <Terminal className="mr-2 h-4 w-4" />
                  Developer
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-6">
          <TabsContent value="profile" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly disabled />
                          </FormControl>
                          <FormDescription>Your role cannot be changed</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Company Settings</CardTitle>
                <CardDescription>Manage your company information and branding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Company Logo</h3>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center">
                        {user.company ? (
                          <div className="text-2xl font-bold text-primary">{user.company.substring(0, 2).toUpperCase()}</div>
                        ) : (
                          <Building className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <Button variant="outline">Upload Logo</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Company Details</h3>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm text-gray-500">Company Name</label>
                        <Input defaultValue={user.company || ""} />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm text-gray-500">Website</label>
                        <Input placeholder="https://example.com" />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm text-gray-500">Tax ID</label>
                        <Input placeholder="Enter tax ID" />
                      </div>
                    </div>
                  </div>

                  <Button disabled>Save Company Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Project Updates</p>
                          <p className="text-sm text-gray-500">Get notified when a project is updated</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Client Responses</p>
                          <p className="text-sm text-gray-500">Get notified when clients respond to proposals</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Task Reminders</p>
                          <p className="text-sm text-gray-500">Get reminded about upcoming tasks</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">WhatsApp Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Client Messages</p>
                          <p className="text-sm text-gray-500">Receive client messages on WhatsApp</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Project Updates</p>
                          <p className="text-sm text-gray-500">Get project updates on WhatsApp</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Button disabled>Save Notification Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable 2FA</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Login Sessions</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-gray-500">Started from Chrome on Windows</p>
                        </div>
                        <div className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">
                          Active
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Danger Zone</h3>
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h4 className="font-medium text-red-700">Delete Account</h4>
                      <p className="text-sm text-red-600 mb-3">All of your data will be permanently deleted.</p>
                      <Button variant="destructive" size="sm">Delete Account</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Developer Tab */}
          {isAdmin && (
            <TabsContent value="developer" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Developer Tools</CardTitle>
                  <CardDescription>Advanced options for system administrators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Database Section */}
                  <div>
                    <h3 className="font-medium text-lg mb-3">Database Management</h3>
                    
                    <Alert className="mb-4">
                      <Database className="h-4 w-4" />
                      <AlertTitle>Database Operations</AlertTitle>
                      <AlertDescription>
                        These operations affect database data and should be used with caution.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid gap-4">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium mb-2">Estimate Configurations</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Seed the database with predefined estimate configurations for pricing calculations.
                        </p>
                        <Button 
                          onClick={() => seedEstimateConfigMutation.mutate()}
                          disabled={seedEstimateConfigMutation.isPending}
                        >
                          {seedEstimateConfigMutation.isPending ? "Seeding..." : "Seed Estimate Configs"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </div>
      </div>
    </>
  );
}
