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
import { 
  AlertCircle, 
  ArrowLeft, 
  Download, 
  Palette,
  MessageSquare,
  Image as ImageIcon,
  Grid2x2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

export default function ClientMoodboardDetail() {
  const [_, params] = useRoute('/client-portal/:clientId/moodboards/:moodboardId');
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const moodboardId = params?.moodboardId ? parseInt(params.moodboardId) : 0;
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
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
  
  // Fetch moodboard
  const { 
    data: moodboard, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/client-portal/moodboards', moodboardId],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest(`/api/client-portal/moodboards/${moodboardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token && !!moodboardId
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      return apiRequest(`/api/client-portal/moodboards/${moodboardId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: comment,
          section: selectedSection
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the moodboard",
      });
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/client-portal/moodboards', moodboardId] });
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Moodboard</h2>
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
          <h2 className="text-2xl font-bold mb-2">Error Loading Moodboard</h2>
          <p className="text-gray-500 mb-4">There was an error loading this moodboard.</p>
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
  
  if (!moodboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Moodboard Not Found</h2>
          <p className="text-gray-500 mb-4">The moodboard you're looking for doesn't exist or you don't have access.</p>
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
  
  // Extract sections data
  const sections = moodboard.sections || {};
  const sectionKeys = Object.keys(sections);
  
  // Get media items for a particular section
  const getMediaForSection = (sectionKey: string) => {
    if (!moodboard.media || !Array.isArray(moodboard.media)) {
      return [];
    }
    
    return moodboard.media.filter((m: any) => m.section === sectionKey);
  };
  
  // Format comments with newest first
  const comments = Array.isArray(moodboard.comments) 
    ? [...moodboard.comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
            <h1 className="text-2xl font-bold text-gray-900 ml-4">{moodboard.name}</h1>
            {moodboard.theme && (
              <Badge variant="outline" className="ml-4">
                {moodboard.theme}
              </Badge>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main moodboard content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Moodboard description */}
            <Card>
              <CardHeader>
                <CardTitle>Design Concept</CardTitle>
                <CardDescription>
                  {moodboard.description || "Design inspiration for your project"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {moodboard.sections && Object.keys(moodboard.sections).length > 0 ? (
                  <div className="space-y-8">
                    {sectionKeys.map((sectionKey) => {
                      const section = sections[sectionKey];
                      const sectionMedia = getMediaForSection(sectionKey);
                      
                      if (!section) return null;
                      
                      return (
                        <div key={sectionKey} className="space-y-4" id={`section-${sectionKey}`}>
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{section.title || sectionKey}</h3>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedSection(sectionKey)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Comment
                            </Button>
                          </div>
                          
                          {section.description && (
                            <p className="text-sm text-gray-600">{section.description}</p>
                          )}
                          
                          {/* Media gallery for this section */}
                          {sectionMedia.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {sectionMedia.map((media: any, index: number) => (
                                <div key={index} className="relative group overflow-hidden rounded-md">
                                  <img 
                                    src={media.url} 
                                    alt={media.caption || `${section.title} inspiration`}
                                    className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
                                  />
                                  {media.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-2 text-white text-sm">
                                      {media.caption}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* No media message */}
                          {sectionMedia.length === 0 && (
                            <div className="bg-gray-50 rounded-md p-6 text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-gray-500">No images in this section yet</p>
                            </div>
                          )}
                          
                          <Separator className="my-4" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Palette className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">This moodboard doesn't have any sections yet.</p>
                  </div>
                )}
                
                {/* Moodboard PDF if available */}
                {moodboard.pdfURL && (
                  <div className="mt-6">
                    <div className="border rounded-md overflow-hidden h-[600px]">
                      <iframe 
                        src={moodboard.pdfURL} 
                        className="w-full h-full"
                        title={moodboard.name}
                      />
                    </div>
                    <div className="flex justify-center mt-4">
                      <a href={moodboard.pdfURL} target="_blank" rel="noopener noreferrer">
                        <Button>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </a>
                    </div>
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
                    Feedback
                  </div>
                </CardTitle>
                <CardDescription>
                  {comments.length > 0 
                    ? `${comments.length} comment${comments.length === 1 ? '' : 's'} on this moodboard`
                    : 'Share your thoughts about this design concept'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {sectionKeys.length > 0 && (
                      <div className="mb-4">
                        <label className="text-sm font-medium">Comment on section (optional)</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge 
                            variant={selectedSection === null ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedSection(null)}
                          >
                            General
                          </Badge>
                          {sectionKeys.map(key => (
                            <Badge 
                              key={key}
                              variant={selectedSection === key ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setSelectedSection(key)}
                            >
                              {sections[key].title || key}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Textarea
                      placeholder="Add your feedback or questions about this design concept..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
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
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {comment.createdBy?.name || 'Anonymous'}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="ml-2"
                            >
                              {comment.createdBy?.type === 'client' ? 'You' : 'Design Team'}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'PPp')}
                          </span>
                        </div>
                        
                        {comment.section && sections[comment.section] && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              On: {sections[comment.section].title || comment.section}
                            </Badge>
                          </div>
                        )}
                        
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
                {moodboard.pdfURL && (
                  <a href={moodboard.pdfURL} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </a>
                )}
                
                {sectionKeys.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Jump to Section</h3>
                    <div className="flex flex-col space-y-2">
                      {sectionKeys.map(key => (
                        <a 
                          key={key}
                          href={`#section-${key}`}
                          className="text-sm text-blue-600 hover:underline flex items-center"
                        >
                          <Grid2x2 className="h-3 w-3 mr-2" />
                          {sections[key].title || key}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Info card */}
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {moodboard.theme && (
                    <div>
                      <p className="text-sm text-gray-500">Theme</p>
                      <p className="font-medium">{moodboard.theme}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {moodboard.createdAt ? format(new Date(moodboard.createdAt), 'PP') : 'Unknown'}
                    </p>
                  </div>
                  {moodboard.updatedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{format(new Date(moodboard.updatedAt), 'PPp')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Moodboard Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-gray-500">Sections</span>
                    <span className="font-medium">{sectionKeys.length}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Images</span>
                    <span className="font-medium">
                      {Array.isArray(moodboard.media) ? moodboard.media.length : 0}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}