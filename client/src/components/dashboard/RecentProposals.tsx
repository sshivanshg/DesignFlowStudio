import { useQuery } from "@tanstack/react-query";
import { FileText, Edit, MoreVertical } from "lucide-react";
import { Proposal } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

export default function RecentProposals() {
  const { data: proposals, isLoading } = useQuery<Proposal[]>({
    queryKey: ['/api/proposals'],
  });

  return (
    <Card className="border border-gray-200">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Recent Proposals</h3>
        <Button 
          variant="link" 
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          + Create New
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="ml-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-64"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-6"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-6"></div>
                  </div>
                </div>
              </div>
            ))
          ) : proposals && proposals.length > 0 ? (
            proposals.slice(0, 3).map((proposal) => (
              <div key={proposal.id} className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">{proposal.title}</h4>
                    <div className="mt-1 flex items-center flex-wrap">
                      <span className="text-xs text-gray-500">Client:</span>
                      <span className="ml-1 text-xs font-medium text-gray-700">
                        {/* In a real app, we would fetch client name using the clientId */}
                        Client {proposal.clientId}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs text-gray-500">Created:</span>
                      <span className="ml-1 text-xs font-medium text-gray-700">
                        {proposal.createdAt ? format(new Date(proposal.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:mt-0 mt-2">
                  {getStatusBadge(proposal.status || '')}
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-center text-gray-500">No proposals found. Create your first proposal to get started.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
