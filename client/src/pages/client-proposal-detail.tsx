import React, { useState, useEffect } from "react";
import { useRoute, useRouter, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowLeft, CheckCircle, Download, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Alert, 
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";

export default function ClientProposalDetail() {
  const [_, params] = useRoute('/client-portal/:clientId/proposals/:proposalId');
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const proposalId = params?.proposalId ? parseInt(params.proposalId) : 0;
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('clientPortalToken');
    if (!storedToken) {
      router[0]('/client-portal/login');
      return;
    }
    setToken(storedToken);
  }, []);
  
  // Fetch proposal
  const { 
    data: proposal, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/client-portal/proposals', proposalId],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest(`/api/client-portal/proposals/${proposalId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token && !!proposalId
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      return apiRequest(`/api/client-portal/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: comment })
      });
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the proposal",
      });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/proposals', proposalId] });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add your comment. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Approve proposal mutation
  const approveProposalMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      return apiRequest(`/api/client-portal/proposals/${proposalId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Proposal Approved",
        description: "You have successfully approved this proposal",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/proposals', proposalId] });
    },
    onError: (error) => {
      console.error("Error approving proposal:", error);
      toast({
        title: "Error",
        description: "Failed to approve the proposal. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleAddComment = () => {
    if (!comment.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment before submitting",
        variant: "destructive"
      });
      return;
    }
    
    addCommentMutation.mutate();
  };
  
  const handleApproveProposal = () => {
    approveProposalMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Proposal</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Proposal</h2>
          <p className="text-gray-500 mb-4">There was an error loading this proposal.</p>
          <Link href={`/client-portal/${clientId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Proposal Not Found</h2>
          <p className="text-gray-500 mb-4">The proposal you're looking for doesn't exist or you don't have access.</p>
          <Link href={`/client-portal/${clientId}`}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Format comments with newest first
  const comments = Array.isArray(proposal.comments) 
    ? [...proposal.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link href={`/client-portal/${clientId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">{proposal.title}</h1>
            <Badge variant={
              proposal.clientApproved ? "success" : 
              proposal.status === "draft" ? "secondary" : "outline"
            } className="ml-4">
              {proposal.clientApproved ? "Approved" : proposal.status}
            </Badge>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main proposal content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal summary */}
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <CardDescription>
                  Created on {proposal.createdAt ? format(new Date(proposal.createdAt), 'PPP') : 'Unknown date'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Proposal PDF frame or download button */}
                {proposal.pdfURL ? (
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden h-[600px]">
                      <iframe 
                        src={proposal.pdfURL} 
                        className="w-full h-full"
                        title={proposal.title}
                      />
                    </div>
                    <div className="flex justify-center">
                      <a href={proposal.pdfURL} target="_blank" rel="noopener noreferrer">
                        <Button>
                          <Download className="h-4 w-4 mr-2" />
                          Download Proposal
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-md bg-gray-50">
                    <p className="text-gray-500">No PDF available for this proposal.</p>
                    
                    {/* If we have proposal data, display it */}
                    {proposal.dataJSON && Object.keys(proposal.dataJSON).length > 0 && (
                      <div className="mt-4 text-left">
                        <h3 className="text-lg font-semibold mb-2">Proposal Content</h3>
                        {/* Display proposal sections */}
                        {proposal.dataJSON.sections && (
                          <div className="space-y-4">
                            {proposal.dataJSON.sections.map((section: any, index: number) => (
                              <div key={index} className="p-4 border rounded-md">
                                <h4 className="font-medium">{section.title}</h4>
                                <p className="mt-1 text-sm">{section.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Comments section */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Comments
                  </div>
                </CardTitle>
                <CardDescription>
                  {comments.length > 0 
                    ? `${comments.length} comment${comments.length === 1 ? '' : 's'} on this proposal`
                    : 'No comments yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add your comment or feedback here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending || !comment.trim()}
                  >
                    {addCommentMutation.isPending ? "Submitting..." : "Add Comment"}
                  </Button>
                </div>
                
                {comments.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <Separator />
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="pt-4">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {comment.createdBy?.name || 'Anonymous'}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="ml-2"
                            >
                              {comment.createdBy?.type === 'client' ? 'Client' : 'Design Team'}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </span>
                        </div>
                        <p className="mt-2">{comment.text}</p>
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!proposal.clientApproved ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Proposal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Proposal</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to approve this proposal? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Important</AlertTitle>
                          <AlertDescription>
                            By approving this proposal, you are agreeing to the terms and conditions outlined in the document.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => document.querySelector('[data-state="open"]')?.dispatchEvent(
                            new KeyboardEvent('keydown', { key: 'Escape' })
                          )}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            handleApproveProposal();
                            document.querySelector('[data-state="open"]')?.dispatchEvent(
                              new KeyboardEvent('keydown', { key: 'Escape' })
                            );
                          }}
                          disabled={approveProposalMutation.isPending}
                        >
                          {approveProposalMutation.isPending ? "Processing..." : "Confirm Approval"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="p-4 bg-green-50 rounded-md border border-green-200 text-green-700 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <div>
                      <p className="font-medium">Proposal Approved</p>
                      <p className="text-sm">You approved this proposal</p>
                    </div>
                  </div>
                )}
                
                {proposal.pdfURL && (
                  <a href={proposal.pdfURL} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Proposal
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
            
            {/* Status and info card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{proposal.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {proposal.createdAt ? format(new Date(proposal.createdAt), 'PP') : 'Unknown'}
                    </p>
                  </div>
                  {proposal.viewedAt && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Last Viewed</p>
                      <p className="font-medium">{format(new Date(proposal.viewedAt), 'PPp')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Designer contact info if available */}
            {proposal.designer && (
              <Card>
                <CardHeader>
                  <CardTitle>Designer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{proposal.designer.name}</p>
                    {proposal.designer.email && (
                      <p className="text-sm">
                        <span className="text-gray-500">Email:</span> {proposal.designer.email}
                      </p>
                    )}
                    {proposal.designer.phone && (
                      <p className="text-sm">
                        <span className="text-gray-500">Phone:</span> {proposal.designer.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}