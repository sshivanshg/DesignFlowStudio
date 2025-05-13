import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Image,
  Palette,
  Save,
  ArrowLeft,
  Upload,
  PlusCircle,
  X,
  Layout,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// Define types locally since import is causing issues
interface Moodboard {
  id: number;
  name: string | null;
  description: string | null;
  theme: string | null;
  client_id: number | null;
  isTemplate: boolean | null;
  sections: any;
  media: any;
  sharedLink: string | null;
  comments: any;
  pdfURL: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface InsertMoodboard {
  name: string;
  description: string | null;
  theme: string | null;
  client_id: number | null;
  isTemplate: boolean | null;
  sections: string | null;
  media?: any;
  sharedLink?: string | null;
  comments?: any;
  pdfURL?: string | null;
}

export default function MoodboardEditor() {
  const [_, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const isEditMode = Boolean(params.id);
  
  // Form state
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [isTemplate, setIsTemplate] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("colorPalette");
  
  // Section states
  const [colorPalette, setColorPalette] = useState<{id: number, type: string, value: string, name: string}[]>([]);
  const [furniture, setFurniture] = useState<{id: number, type: string, url: string}[]>([]);
  const [layout, setLayout] = useState<{id: number, type: string, url: string}[]>([]);
  const [lighting, setLighting] = useState<{id: number, type: string, url: string}[]>([]);
  const [inspiration, setInspiration] = useState<{id: number, type: string, url: string}[]>([]);
  
  // Dialogs
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorValue, setNewColorValue] = useState("#ffffff");
  const [newImageUrl, setNewImageUrl] = useState("");
  
  // Fetch moodboard data if editing
  const { data: moodboard, isLoading: isMoodboardLoading } = useQuery<Moodboard>({
    queryKey: ['/api/moodboards', params.id],
    enabled: isEditMode,
  });
  
  // Fetch clients for the dropdown
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['/api/clients'],
  });
  
  // Create/update mutation
  const createMutation = useMutation({
    mutationFn: async (moodboardData: InsertMoodboard) => {
      return await fetch('/api/moodboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moodboardData),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards'] });
      toast({
        title: "Success",
        description: "Moodboard created successfully",
      });
      navigate("/moodboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create moodboard",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async (moodboardData: Partial<Moodboard>) => {
      return await fetch(`/api/moodboards/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moodboardData),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards', params.id] });
      toast({
        title: "Success",
        description: "Moodboard updated successfully",
      });
      navigate("/moodboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update moodboard",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Populate form with moodboard data if in edit mode
  useEffect(() => {
    if (moodboard) {
      setName(moodboard.name || "");
      setDescription(moodboard.description || "");
      setTheme(moodboard.theme || "");
      setClientId(moodboard.client_id);
      setIsTemplate(moodboard.isTemplate || false);
      
      if (moodboard.sections) {
        const sections = JSON.parse(moodboard.sections as string);
        if (sections.colorPalette) setColorPalette(sections.colorPalette);
        if (sections.furniture) setFurniture(sections.furniture);
        if (sections.layout) setLayout(sections.layout);
        if (sections.lighting) setLighting(sections.lighting);
        if (sections.inspiration) setInspiration(sections.inspiration);
      }
    }
  }, [moodboard]);
  
  // Save moodboard
  const handleSave = () => {
    const sections = {
      colorPalette,
      furniture,
      layout, 
      lighting,
      inspiration
    };
    
    const moodboardData = {
      name,
      description,
      theme,
      client_id: clientId,
      isTemplate,
      sections: JSON.stringify(sections),
    };
    
    if (isEditMode) {
      updateMutation.mutate(moodboardData);
    } else {
      createMutation.mutate(moodboardData as InsertMoodboard);
    }
  };
  
  // Add a new color
  const handleAddColor = () => {
    if (!newColorName) {
      toast({
        title: "Error",
        description: "Please provide a name for the color",
        variant: "destructive",
      });
      return;
    }
    
    const newColor = {
      id: Date.now(),
      type: "color",
      value: newColorValue,
      name: newColorName
    };
    
    setColorPalette([...colorPalette, newColor]);
    setNewColorName("");
    setNewColorValue("#ffffff");
    setColorDialogOpen(false);
  };
  
  // Add a new image to the current section
  const handleAddImage = () => {
    if (!newImageUrl) {
      toast({
        title: "Error",
        description: "Please provide a URL for the image",
        variant: "destructive",
      });
      return;
    }
    
    const newImage = {
      id: Date.now(),
      type: "image",
      url: newImageUrl
    };
    
    switch (activeTab) {
      case "furniture":
        setFurniture([...furniture, newImage]);
        break;
      case "layout":
        setLayout([...layout, newImage]);
        break;
      case "lighting":
        setLighting([...lighting, newImage]);
        break;
      case "inspiration":
        setInspiration([...inspiration, newImage]);
        break;
    }
    
    setNewImageUrl("");
    setImageDialogOpen(false);
  };
  
  // Remove an item from a section
  const handleRemoveItem = (section: string, id: number) => {
    switch (section) {
      case "colorPalette":
        setColorPalette(colorPalette.filter(item => item.id !== id));
        break;
      case "furniture":
        setFurniture(furniture.filter(item => item.id !== id));
        break;
      case "layout":
        setLayout(layout.filter(item => item.id !== id));
        break;
      case "lighting":
        setLighting(lighting.filter(item => item.id !== id));
        break;
      case "inspiration":
        setInspiration(inspiration.filter(item => item.id !== id));
        break;
    }
  };
  
  if (isEditMode && isMoodboardLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate("/moodboard")} className="mr-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? "Edit Moodboard" : "Create Moodboard"}</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Main Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Moodboard Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a name for your moodboard"
                  />
                </div>
                
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Input
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Modern, Minimalist, Cozy, etc."
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isTemplate"
                    checked={isTemplate}
                    onChange={(e) => setIsTemplate(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isTemplate">Save as Template</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={clientId ? String(clientId) : ""}
                    onValueChange={(value) => setClientId(value ? Number(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Client (Template)</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={String(client.id)}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this moodboard"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Moodboard Sections */}
        <Card>
          <CardContent className="p-6">
            <Tabs
              defaultValue="colorPalette"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start mb-6 overflow-x-auto">
                <TabsTrigger value="colorPalette" className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" /> Color Palette
                </TabsTrigger>
                <TabsTrigger value="furniture" className="flex items-center">
                  <Image className="mr-2 h-4 w-4" /> Furniture
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex items-center">
                  <Layout className="mr-2 h-4 w-4" /> Layout
                </TabsTrigger>
                <TabsTrigger value="lighting" className="flex items-center">
                  <Lightbulb className="mr-2 h-4 w-4" /> Lighting
                </TabsTrigger>
                <TabsTrigger value="inspiration" className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" /> Inspiration
                </TabsTrigger>
              </TabsList>
              
              {/* Color Palette Section */}
              <TabsContent value="colorPalette">
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Color Palette</h3>
                  <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Color
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add a New Color</DialogTitle>
                        <DialogDescription>
                          Enter a color name and pick a color value
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="colorName">Color Name</Label>
                          <Input
                            id="colorName"
                            value={newColorName}
                            onChange={(e) => setNewColorName(e.target.value)}
                            placeholder="e.g., Navy Blue, Soft Beige"
                          />
                        </div>
                        <div>
                          <Label htmlFor="colorValue">Color Value</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              id="colorValue"
                              value={newColorValue}
                              onChange={(e) => setNewColorValue(e.target.value)}
                              className="h-10 w-10 rounded-md"
                            />
                            <Input
                              value={newColorValue}
                              onChange={(e) => setNewColorValue(e.target.value)}
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddColor}>Add Color</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {colorPalette.map((color) => (
                    <div
                      key={color.id}
                      className="border rounded-md p-4 relative group"
                    >
                      <div
                        className="w-full h-24 rounded-md mb-2"
                        style={{ backgroundColor: color.value }}
                      ></div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">{color.name}</p>
                        <p className="text-xs text-gray-500">{color.value}</p>
                      </div>
                      <button
                        className="absolute top-2 right-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem("colorPalette", color.id)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {colorPalette.length === 0 && (
                  <div className="text-center p-12 text-gray-400">
                    No colors added yet. Click "Add Color" to start building your palette.
                  </div>
                )}
              </TabsContent>
              
              {/* Other Sections (Furniture, Layout, Lighting, Inspiration) */}
              {["furniture", "layout", "lighting", "inspiration"].map((section) => (
                <TabsContent key={section} value={section}>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-medium capitalize">{section}</h3>
                    <Dialog open={imageDialogOpen && activeTab === section} onOpenChange={setImageDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Upload className="mr-2 h-4 w-4" /> Add Image
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Image</DialogTitle>
                          <DialogDescription>
                            Enter the URL of the image you want to add
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div>
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input
                              id="imageUrl"
                              value={newImageUrl}
                              onChange={(e) => setNewImageUrl(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                          {newImageUrl && (
                            <div className="border rounded-md p-2">
                              <p className="text-xs mb-2">Preview:</p>
                              <img
                                src={newImageUrl}
                                alt="Preview"
                                className="max-h-40 mx-auto object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/150?text=Invalid+Image";
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddImage}>Add Image</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      let items: {id: number, type: string, url: string}[] = [];
                      switch (section) {
                        case "furniture":
                          items = furniture;
                          break;
                        case "layout":
                          items = layout;
                          break;
                        case "lighting":
                          items = lighting;
                          break;
                        case "inspiration":
                          items = inspiration;
                          break;
                        default:
                          // Empty array is the default
                      }
                      
                      return items.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-md p-2 relative group"
                        >
                          <img
                            src={item.url}
                            alt={`${section} image`}
                            className="w-full h-48 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/150?text=Image+Not+Found";
                            }}
                          />
                          <button
                            className="absolute top-2 right-2 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveItem(section, item.id)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  {(() => {
                    let items: {id: number, type: string, url: string}[] = [];
                    switch (section) {
                      case "furniture":
                        items = furniture;
                        break;
                      case "layout":
                        items = layout;
                        break;
                      case "lighting":
                        items = lighting;
                        break;
                      case "inspiration":
                        items = inspiration;
                        break;
                      default:
                        // Empty array is the default
                    }
                    
                    return items.length === 0 && (
                      <div className="text-center p-12 text-gray-400">
                        No images added yet. Click "Add Image" to add {section} images.
                      </div>
                    );
                  })()}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Bottom Actions */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate("/moodboard")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Moodboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}