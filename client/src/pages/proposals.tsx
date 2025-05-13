import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Proposal, Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Plus, Download, Edit, Eye, Trash } from "lucide-react";
import { format } from "date-fns";

export default function Proposals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: proposals, isLoading: isProposalsLoading } = useQuery<Proposal[]>({
    queryKey: ['/api/proposals'],
  });
  
  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });
  
  const getClientName = (clientId?: number | null) => {
    if (!clientId || !clients) return "Unknown Client";
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown Client";
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Draft</Badge>;
      case "pending_review":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case "revision_needed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Revision Needed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getFilteredProposals = () => {
    if (!proposals) return [];
    
    let filtered = proposals;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(proposal => 
        proposal.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(proposal => proposal.status === activeTab);
    }
    
    return filtered;
  };
  
  const filteredProposals = getFilteredProposals();
  
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposals</h1>
        <p className="text-gray-500">Create and manage design proposals for your clients</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search proposals..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => window.location.href = '/proposal-editor'}>
              <Plus className="mr-2 h-4 w-4" /> Create Proposal
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
              <TabsTrigger value="pending_review">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="revision_needed">Needs Revision</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {isProposalsLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProposals.length > 0 ? (
                filteredProposals.map((proposal) => (
                  <Card key={proposal.id} className="overflow-hidden">
                    <div className="bg-gray-50 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <div className="bg-primary-100 text-primary-600 rounded-lg h-10 w-10 flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 line-clamp-1">{proposal.title}</h3>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span className="font-medium">{getClientName(proposal.client_id)}</span>
                              <span className="mx-1">•</span>
                              <span>
                                {proposal.createdAt 
                                  ? format(new Date(proposal.createdAt), 'MMM d, yyyy') 
                                  : 'No date'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(proposal.status || 'draft')}
                        </div>
                      </div>
                      {proposal.dataJSON && typeof proposal.dataJSON === 'object' && (proposal.dataJSON as any).amount && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-1 font-medium">₹{(proposal.dataJSON as any).amount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex justify-between items-center border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-primary text-white">
                            {getClientName(proposal.client_id).split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">Project {proposal.lead_id ? `#${proposal.lead_id}` : ''}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => window.location.href = `/proposal-editor/${proposal.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No proposals found</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    {searchQuery 
                      ? `No proposals matching "${searchQuery}"` 
                      : "Create your first proposal to showcase your design ideas to clients."}
                  </p>
                  <Button onClick={() => window.location.href = '/proposal-editor'}>
                    <Plus className="mr-2 h-4 w-4" /> Create New Proposal
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
