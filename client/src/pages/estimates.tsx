import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Estimate } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Calculator, 
  Edit, 
  Eye, 
  Download, 
  ChevronRight, 
  Clock,
  Check,
  AlertTriangle,
  FileText
} from "lucide-react";
import { format } from "date-fns";

export default function Estimates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: estimates, isLoading } = useQuery<Estimate[]>({
    queryKey: ['/api/estimates'],
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Draft
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Sent
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <Check className="h-3 w-3" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getFilteredEstimates = () => {
    if (!estimates) return [];
    
    let filtered = estimates;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(estimate => 
        estimate.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(estimate => estimate.status === activeTab);
    }
    
    return filtered;
  };
  
  const filteredEstimates = getFilteredEstimates();
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Estimates</h1>
        <p className="text-gray-500">Create and manage cost estimates for your design projects</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search estimates..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Estimate
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="px-6 py-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Estimate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEstimates.length > 0 ? (
                    filteredEstimates.map((estimate) => (
                      <tr key={estimate.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="bg-primary-100 text-primary-600 rounded-lg h-8 w-8 flex items-center justify-center mr-3">
                              <Calculator className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{estimate.title}</div>
                              <div className="text-xs text-gray-500">
                                Project {estimate.projectId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">Client {estimate.clientId}</div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(estimate.status || 'draft')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {estimate.createdAt 
                            ? format(new Date(estimate.createdAt), 'MMM d, yyyy') 
                            : 'No date'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {estimate.total ? formatCurrency(estimate.total) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <Calculator className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No estimates found</h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                          {searchQuery 
                            ? `No estimates matching "${searchQuery}"` 
                            : "Create your first estimate to provide accurate cost breakdowns to clients."}
                        </p>
                        <Button className="mx-auto">
                          <Plus className="mr-2 h-4 w-4" /> Create New Estimate
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
