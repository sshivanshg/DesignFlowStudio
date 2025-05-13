import { useQuery } from "@tanstack/react-query";
import { Moodboard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Image, Palette, Pencil, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function MoodboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [_, navigate] = useLocation();
  
  const { data: moodboards, isLoading } = useQuery<Moodboard[]>({
    queryKey: ['/api/moodboards'],
  });
  
  const filteredMoodboards = moodboards?.filter(moodboard =>
    (moodboard.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // In a real app, we would fetch this data from the API
  const demoMoodboardItems = [
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=300&h=300&q=80",
    },
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=300&h=300&q=80",
    },
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1618219944342-824e40a13285?auto=format&fit=crop&w=300&h=300&q=80",
    },
    {
      type: "color",
      value: "#f8f9fa",
      name: "Whisper White",
    },
    {
      type: "color",
      value: "#343a40",
      name: "Charcoal",
    },
    {
      type: "color",
      value: "#ffe066",
      name: "Mellow Yellow",
    },
  ];
  
  const MoodboardCard = ({ moodboard }: { moodboard: Moodboard }) => {
    // In a real app, we would use moodboard.items
    const items = demoMoodboardItems;
    
    return (
      <Card className="overflow-hidden">
        <div className="aspect-[4/3] w-full bg-gray-50">
          <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full">
            {items.slice(0, 6).map((item, index) => (
              <div key={index} className="relative overflow-hidden">
                {item.type === "image" ? (
                  <img 
                    src={item.url} 
                    alt={`Moodboard item ${index}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: item.value }}
                  >
                    {item.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">{moodboard.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {moodboard.description || "No description"}
              </p>
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => navigate(`/moodboard/edit/${moodboard.id}`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  // Implementation for duplicate in a future PR
                  alert('Duplicate functionality to be implemented');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  // Implementation for delete in a future PR
                  if (confirm('Are you sure you want to delete this moodboard?')) {
                    alert('Delete functionality to be implemented');
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Moodboards</h1>
        <p className="text-gray-500">Create visual inspirations and design concepts for your clients</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search moodboards..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate("/moodboard/create")}>
              <Plus className="mr-2 h-4 w-4" /> Create Moodboard
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Moodboards</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="shared">Shared with Client</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : filteredMoodboards && filteredMoodboards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMoodboards.map((moodboard) => (
            <MoodboardCard key={moodboard.id} moodboard={moodboard} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Palette className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No moodboards found</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            {searchQuery 
              ? `No moodboards matching "${searchQuery}"` 
              : "Create your first moodboard to showcase design concepts and inspirations."}
          </p>
          <Button className="mx-auto" onClick={() => navigate("/moodboard/create")}>
            <Plus className="mr-2 h-4 w-4" /> Create New Moodboard
          </Button>
        </Card>
      )}
    </>
  );
}
