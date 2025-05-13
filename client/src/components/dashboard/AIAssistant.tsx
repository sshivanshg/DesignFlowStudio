import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Settings, Send, RefreshCw, Palette, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  generateDesignInsights, 
  DesignInsightRequest, 
  DesignInsightResponse,
  generateMoodboardSuggestions,
  MoodboardSuggestionRequest,
  MoodboardSuggestionResponse
} from "@/lib/api";
import { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Helper to convert color name to hex (simplified)
const getColorHex = (color: string) => {
  const colorMap: Record<string, string> = {
    red: "#e63946",
    blue: "#457b9d",
    green: "#2a9d8f",
    yellow: "#f4a261",
    purple: "#9d4edd",
    pink: "#ffafcc",
    orange: "#fb8500",
    teal: "#006d77",
    brown: "#774936",
    gray: "#adb5bd"
  };
  
  return colorMap[color.toLowerCase()] || "#6c757d";
};

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState("insights");
  const [query, setQuery] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [roomType, setRoomType] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [designInsights, setDesignInsights] = useState<DesignInsightResponse | null>(null);
  const [moodboardSuggestions, setMoodboardSuggestions] = useState<MoodboardSuggestionResponse | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for context
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Design insights mutation
  const insightsMutation = useMutation({
    mutationFn: (data: DesignInsightRequest) => generateDesignInsights(data),
    onSuccess: (data) => {
      setDesignInsights(data);
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "AI Insights Generated",
        description: "Design recommendations have been generated based on your project details.",
      });
    },
    onError: (error) => {
      console.error("Error generating insights:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to generate design insights. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Moodboard suggestions mutation
  const moodboardMutation = useMutation({
    mutationFn: (data: MoodboardSuggestionRequest) => generateMoodboardSuggestions(data),
    onSuccess: (data) => {
      setMoodboardSuggestions(data);
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Moodboard Suggestions Generated",
        description: "New moodboard ideas have been created based on your preferences.",
      });
    },
    onError: (error) => {
      console.error("Error generating moodboard suggestions:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to generate moodboard suggestions. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Generate project description based on existing projects
  useEffect(() => {
    if (projects && projects.length > 0 && !projectDescription) {
      const recentProject = projects[0];
      setProjectDescription(`${recentProject.name} in ${recentProject.location || 'unknown location'}`);
    }
  }, [projects, projectDescription]);

  // Handle submitting a query for design insights
  const handleInsightsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a project description.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    const projectId = projects && projects.length > 0 ? projects[0].id : undefined;
    const clientId = projects && projects.length > 0 && projects[0].clientId ? projects[0].clientId : undefined;
    
    insightsMutation.mutate({
      projectDescription,
      roomType,
      stylePreferences: stylePreference,
      budget,
      projectId,
      clientId
    });
  };

  // Handle submitting for moodboard suggestions
  const handleMoodboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomType || !stylePreference) {
      toast({
        title: "Missing Information",
        description: "Please enter both room type and style preference.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    const projectId = projects && projects.length > 0 ? projects[0].id : undefined;
    const clientId = projects && projects.length > 0 && projects[0].clientId ? projects[0].clientId : undefined;
    
    // Generate some basic colors based on the style preference
    const colors = ["#e9ecef", "#dee2e6", "#adb5bd", "#495057", "#212529"];
    
    moodboardMutation.mutate({
      roomType,
      style: stylePreference,
      colors,
      projectId,
      clientId
    });
  };

  // Handle simple AI queries
  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // This is a simplified approach - in a production app, you'd likely
    // want to use a more sophisticated method of handling general queries
    toast({
      title: "AI Assistant",
      description: "Your question has been received. For complex design questions, please use the Design Insights tab.",
    });
    
    setQuery("");
  };

  // Reset the form and results
  const handleReset = () => {
    setProjectDescription("");
    setRoomType("");
    setStylePreference("");
    setBudget("");
    setDesignInsights(null);
    setMoodboardSuggestions(null);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-5 py-4 bg-gradient-to-r from-primary to-accent flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-white">AI Design Assistant</h3>
        <Button variant="ghost" size="icon" className="text-white">
          <Settings className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="bg-white p-5 space-y-4">
        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Design Intelligence</h4>
              <p className="text-xs text-gray-500">AI-powered design recommendations</p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="insights">Design Insights</TabsTrigger>
            <TabsTrigger value="moodboard">Moodboard Ideas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-4">
            {!designInsights ? (
              <form onSubmit={handleInsightsSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Project Description
                  </label>
                  <Textarea 
                    placeholder="Describe your project (e.g., Modern apartment renovation in downtown)"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Room Type
                    </label>
                    <Input 
                      placeholder="Living room, bedroom, etc."
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Style Preference
                    </label>
                    <Input 
                      placeholder="Modern, Traditional, Minimalist, etc."
                      value={stylePreference}
                      onChange={(e) => setStylePreference(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Budget (optional)
                    </label>
                    <Input 
                      placeholder="Enter a budget range"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !projectDescription.trim()}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    "Generate AI Design Insights"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Design Suggestions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {designInsights.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    <div className="flex items-center">
                      <Palette className="h-4 w-4 mr-1" />
                      Color Palette
                    </div>
                  </h4>
                  <div className="flex space-x-2 mb-3">
                    {designInsights.colorPalette.map((color, i) => (
                      <div 
                        key={i} 
                        className="w-8 h-8 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Material Suggestions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {designInsights.materialSuggestions.map((material, i) => (
                      <li key={i} className="text-sm text-gray-600">{material}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 mr-1 text-gray-600" />
                    <h4 className="text-sm font-medium text-gray-900">Project Timeline</h4>
                  </div>
                  <p className="text-sm text-gray-600">{designInsights.estimatedTimeframe}</p>
                  
                  {designInsights.budgetBreakdown && (
                    <>
                      <h4 className="text-sm font-medium text-gray-900 mt-3 mb-2">Budget Breakdown</h4>
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Furniture:</span>
                          <span className="font-medium">${designInsights.budgetBreakdown.furniture}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Materials:</span>
                          <span className="font-medium">${designInsights.budgetBreakdown.materials}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Labor:</span>
                          <span className="font-medium">${designInsights.budgetBreakdown.labor}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Accessories:</span>
                          <span className="font-medium">${designInsights.budgetBreakdown.accessories}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>Total Estimated Cost:</span>
                          <span>${designInsights.budgetBreakdown.total}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Create New Design Insight
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="moodboard" className="space-y-4">
            {!moodboardSuggestions ? (
              <form onSubmit={handleMoodboardSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Room Type
                  </label>
                  <Input 
                    placeholder="Living room, bedroom, bathroom, etc."
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Style Preference
                  </label>
                  <Input 
                    placeholder="Scandinavian, Industrial, Bohemian, etc."
                    value={stylePreference}
                    onChange={(e) => setStylePreference(e.target.value)}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !roomType.trim() || !stylePreference.trim()}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating Moodboard Ideas...
                    </>
                  ) : (
                    "Generate Moodboard Ideas"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Image Concepts for Moodboard</h4>
                  <div className="space-y-2">
                    {moodboardSuggestions.imagePrompts.map((prompt, i) => (
                      <div key={i} className="p-2 border border-gray-200 rounded-md">
                        <p className="text-sm text-gray-600">{prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Key Elements to Include</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {moodboardSuggestions.textSuggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
                
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Create New Moodboard Concept
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <form onSubmit={handleQuerySubmit} className="relative">
          <Input 
            type="text" 
            placeholder="Ask AI for design advice..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10"
          />
          <Button 
            type="submit"
            variant="ghost" 
            size="icon" 
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <Send className="h-4 w-4 text-gray-400" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
