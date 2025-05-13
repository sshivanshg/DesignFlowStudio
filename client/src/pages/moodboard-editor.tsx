import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "wouter";
import { Moodboard, InsertMoodboard } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Save, ArrowLeft, Plus, Upload, Palette, Trash2, 
  Image, Layout, Sofa, Lightbulb, Copy, Share2
} from "lucide-react";

// Define the section types and their icons
const sectionIcons = {
  colorPalette: <Palette className="h-5 w-5" />,
  furniture: <Sofa className="h-5 w-5" />,
  layout: <Layout className="h-5 w-5" />,
  lighting: <Lightbulb className="h-5 w-5" />,
  inspiration: <Image className="h-5 w-5" />
};

// Extended schema for form validation
const moodboardFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  theme: z.string().optional(),
  client_id: z.number().optional().nullable(),
  isTemplate: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof moodboardFormSchema>;

export default function MoodboardEditorPage() {
  const [params] = useParams();
  const moodboardId = params?.id ? parseInt(params.id) : undefined;
  const isEditing = !!moodboardId;
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<string>("colorPalette");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [aiSuggestDialogOpen, setAiSuggestDialogOpen] = useState(false);
  
  // Fetch clients for the dropdown
  const { data: clients } = useQuery({
    queryKey: ['/api/clients']
  });
  
  // Fetch moodboard data if editing
  const { data: moodboard, isLoading: isMoodboardLoading } = useQuery({
    queryKey: ['/api/moodboards', moodboardId],
    enabled: isEditing,
  });
  
  // Initialize form with default values or existing moodboard data
  const form = useForm<FormValues>({
    resolver: zodResolver(moodboardFormSchema),
    defaultValues: {
      name: "",
      description: "",
      theme: "",
      client_id: null,
      isTemplate: false
    }
  });
  
  // Update form values when moodboard data is loaded
  useEffect(() => {
    if (moodboard) {
      form.reset({
        name: moodboard.name || "",
        description: moodboard.description || "",
        theme: moodboard.theme || "",
        client_id: moodboard.client_id,
        isTemplate: moodboard.isTemplate || false
      });
    }
  }, [moodboard, form]);
  
  // Create new moodboard mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertMoodboard) => {
      return apiRequest('/api/moodboards', {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Moodboard created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards'] });
      navigate("/moodboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create moodboard",
        variant: "destructive",
      });
      console.error("Error creating moodboard:", error);
    }
  });
  
  // Update existing moodboard mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Moodboard>) => {
      return apiRequest(`/api/moodboards/${moodboardId}`, {
        method: 'PATCH',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Moodboard updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards', moodboardId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update moodboard",
        variant: "destructive",
      });
      console.error("Error updating moodboard:", error);
    }
  });
  
  // Duplicate moodboard mutation
  const duplicateMutation = useMutation({
    mutationFn: () => {
      return apiRequest(`/api/moodboards/${moodboardId}/duplicate`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Moodboard duplicated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards'] });
      // Navigate to the duplicated moodboard
      navigate(`/moodboard/edit/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to duplicate moodboard",
        variant: "destructive",
      });
      console.error("Error duplicating moodboard:", error);
    }
  });
  
  // Handle form submission
  function onSubmit(formValues: FormValues) {
    // For sections, we need to preserve the existing content
    // or initialize with default empty sections
    const sections = moodboard?.sections || {
      colorPalette: { title: "Color Palette", items: [] },
      furniture: { title: "Furniture", items: [] },
      layout: { title: "Layout", items: [] },
      lighting: { title: "Lighting", items: [] },
      inspiration: { title: "Theme Inspiration", items: [] }
    };
    
    const moodboardData = {
      ...formValues,
      sections
    };
    
    if (isEditing) {
      updateMutation.mutate(moodboardData);
    } else {
      createMutation.mutate(moodboardData as InsertMoodboard);
    }
  }
  
  // Mock data for the UI demo
  const mockItems = {
    colorPalette: [
      { id: 1, type: "color", value: "#f8f9fa", name: "Whisper White" },
      { id: 2, type: "color", value: "#343a40", name: "Charcoal" },
      { id: 3, type: "color", value: "#ffe066", name: "Mellow Yellow" },
      { id: 4, type: "color", value: "#74c0fc", name: "Sky Blue" }
    ],
    furniture: [
      { id: 5, type: "image", url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop" },
      { id: 6, type: "image", url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop" }
    ],
    layout: [
      { id: 7, type: "image", url: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=400&h=300&fit=crop" }
    ],
    lighting: [
      { id: 8, type: "image", url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop" }
    ],
    inspiration: [
      { id: 9, type: "image", url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop" },
      { id: 10, type: "image", url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop" }
    ]
  };
  
  // For the real implementation, we'd use moodboard.sections[activeSection].items instead of mockItems
  const currentSectionItems = moodboard?.sections?.[activeSection]?.items || mockItems[activeSection];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate("/moodboard")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Moodboard" : "Create Moodboard"}
            </h1>
          </div>
          <div className="flex space-x-2">
            {isEditing && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => duplicateMutation.mutate()}
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </>
            )}
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Save Changes" : "Save Moodboard"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Moodboard Details */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moodboard Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter moodboard name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe this moodboard" 
                          className="resize-none" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g., Minimalist, Modern, Rustic" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select 
                        onValueChange={value => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No client</SelectItem>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isTemplate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Save as Template</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Make this available as a template for future moodboards
                        </p>
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
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-900 mb-3">AI Suggestions</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Use AI to generate content suggestions for your moodboard based on your description and theme.
                </p>
                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => setAiSuggestDialogOpen(true)}
                >
                  Get AI Suggestions
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Moodboard Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Moodboard Sections</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                
                <Tabs 
                  defaultValue="colorPalette" 
                  value={activeSection}
                  onValueChange={setActiveSection}
                >
                  <TabsList className="w-full grid grid-cols-5">
                    <TabsTrigger value="colorPalette" className="flex items-center">
                      <Palette className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Colors</span>
                    </TabsTrigger>
                    <TabsTrigger value="furniture">
                      <Sofa className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Furniture</span>
                    </TabsTrigger>
                    <TabsTrigger value="layout">
                      <Layout className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Layout</span>
                    </TabsTrigger>
                    <TabsTrigger value="lighting">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Lighting</span>
                    </TabsTrigger>
                    <TabsTrigger value="inspiration">
                      <Image className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Inspiration</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      {sectionIcons[activeSection]}
                      <span className="ml-2">
                        {moodboard?.sections?.[activeSection]?.title || 
                         (activeSection === "colorPalette" ? "Color Palette" : 
                          activeSection === "furniture" ? "Furniture" :
                          activeSection === "layout" ? "Layout" :
                          activeSection === "lighting" ? "Lighting" : "Theme Inspiration")}
                      </span>
                    </h4>
                    
                    <ScrollArea className="h-[350px] pr-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentSectionItems.length > 0 ? (
                          currentSectionItems.map((item, index) => (
                            <div 
                              key={item.id || index} 
                              className="relative group rounded-md overflow-hidden border border-gray-200"
                            >
                              {item.type === "image" ? (
                                <div className="aspect-[4/3]">
                                  <img 
                                    src={item.url} 
                                    alt={`Item ${index + 1}`} 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Button 
                                      variant="destructive" 
                                      size="icon" 
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="aspect-[4/3] flex flex-col items-center justify-center p-2"
                                  style={{ backgroundColor: item.value }}
                                >
                                  <span className="text-sm font-medium text-center mb-1">
                                    {item.name}
                                  </span>
                                  <Badge variant="outline" className="bg-white bg-opacity-80">
                                    {item.value}
                                  </Badge>
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Button 
                                      variant="destructive" 
                                      size="icon" 
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                              {sectionIcons[activeSection]}
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">No items yet</h4>
                            <p className="text-gray-500 mb-4">
                              Upload images or add colors to build your {activeSection === "colorPalette" ? "color palette" : activeSection}
                            </p>
                            <Button 
                              onClick={() => setUploadDialogOpen(true)}
                              variant="outline"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                          </div>
                        )}
                        
                        {currentSectionItems.length > 0 && (
                          <button
                            type="button"
                            className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center p-4 h-full min-h-[120px] hover:border-gray-400 transition-colors"
                            onClick={() => setUploadDialogOpen(true)}
                          >
                            <Plus className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Add Item</span>
                          </button>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to {activeSection}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
              {activeSection === "colorPalette" && (
                <TabsTrigger value="color">Add Color</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="upload" className="py-4">
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop an image, or click to browse
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <Button asChild variant="outline" size="sm">
                  <label htmlFor="image-upload">Browse Files</label>
                </Button>
              </div>
            </TabsContent>
            {activeSection === "colorPalette" && (
              <TabsContent value="color" className="py-4 space-y-4">
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel>Color Name</FormLabel>
                    <Input placeholder="e.g., Soft Beige" />
                  </FormItem>
                  <FormItem>
                    <FormLabel>Color Value</FormLabel>
                    <div className="flex space-x-2">
                      <Input placeholder="#FFFFFF" />
                      <input
                        type="color"
                        className="h-10 w-10 rounded border"
                        defaultValue="#FFFFFF"
                      />
                    </div>
                  </FormItem>
                </div>
              </TabsContent>
            )}
          </Tabs>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button">
              Add to Moodboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Suggestion Dialog */}
      <Dialog open={aiSuggestDialogOpen} onOpenChange={setAiSuggestDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Suggestions</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Generate content suggestions based on your moodboard theme and description.
            </p>
            <div className="space-y-4">
              <FormItem>
                <FormLabel>What are you looking for?</FormLabel>
                <Select defaultValue="colors">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colors">Color Palette Suggestions</SelectItem>
                    <SelectItem value="furniture">Furniture Suggestions</SelectItem>
                    <SelectItem value="layout">Layout Suggestions</SelectItem>
                    <SelectItem value="lighting">Lighting Suggestions</SelectItem>
                    <SelectItem value="all">Complete Moodboard Suggestions</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
              <FormItem>
                <FormLabel>Design Style</FormLabel>
                <Input placeholder="e.g., Scandinavian, Contemporary, Industrial" />
              </FormItem>
              <FormItem>
                <FormLabel>Additional Details</FormLabel>
                <Textarea
                  placeholder="Describe the room, preferred materials, colors to avoid, etc."
                  className="resize-none"
                  rows={3}
                />
              </FormItem>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAiSuggestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button">
              Generate Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}