import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Settings, Send } from "lucide-react";

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  
  // In a real application, these suggestions would come from an API
  const suggestions = [
    {
      type: "suggestion",
      content: "Modern apartments in Mumbai are trending toward more functional workspaces. Consider incorporating multi-purpose furniture in your current renovation project."
    },
    {
      type: "cost_optimization",
      content: "Your Restaurant Redesign project could save approximately ₹45,000 by sourcing local materials for wall treatments."
    }
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // In a real application, this would send the query to the OpenAI API
    console.log("AI Query:", query);
    setQuery("");
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
              <h4 className="text-sm font-medium text-gray-900">Design Insights</h4>
              <p className="text-xs text-gray-500">Based on your recent projects</p>
            </div>
          </div>
        </div>
        
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">
                {suggestion.type === "suggestion" ? "Suggestion:" : "Cost Optimization:"}
              </span>{" "}
              {suggestion.content}
            </p>
            <div className="mt-2 flex justify-end">
              <Button 
                variant="link" 
                className="text-xs text-primary-600 hover:text-primary-700 font-medium p-0 h-auto"
              >
                {suggestion.type === "suggestion" ? "Apply to Project" : "View Details"}
              </Button>
            </div>
          </div>
        ))}
        
        <form onSubmit={handleSubmit} className="relative">
          <Input 
            type="text" 
            placeholder="Ask AI for design inspiration..." 
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
