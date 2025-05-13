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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertCircle, 
  ArrowLeft, 
  Download, 
  DollarSign,
  Calendar,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

export default function ClientEstimateDetail() {
  const [_, params] = useRoute('/client-portal/:clientId/estimates/:estimateId');
  const clientId = params?.clientId ? parseInt(params.clientId) : 0;
  const estimateId = params?.estimateId ? parseInt(params.estimateId) : 0;
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('clientPortalToken');
    if (!storedToken) {
      router[0]('/client-portal/login');
      return;
    }
    setToken(storedToken);
  }, []);
  
  // Fetch estimate details
  const { 
    data: estimate, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/client-portal/estimates', estimateId],
    queryFn: async () => {
      if (!token) return null;
      return apiRequest(`/api/client-portal/estimates/${estimateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    },
    enabled: !!token && !!estimateId
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Estimate</h2>
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
          <h2 className="text-2xl font-bold mb-2">Error Loading Estimate</h2>
          <p className="text-gray-500 mb-4">There was an error loading this estimate.</p>
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
  
  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Estimate Not Found</h2>
          <p className="text-gray-500 mb-4">The estimate you're looking for doesn't exist or you don't have access.</p>
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
  
  // Extract data from estimate
  const {
    title,
    status,
    subtotal = 0,
    gst = 0,
    total = 0,
    createdAt,
    updatedAt,
    configJSON = {},
    milestoneBreakdown = []
  } = estimate;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
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
            <h1 className="text-2xl font-bold text-gray-900 ml-4">{title}</h1>
            <Badge variant={
              status === "approved" ? "success" : 
              status === "draft" ? "secondary" : "outline"
            } className="ml-4">
              {status}
            </Badge>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main estimate content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estimate summary */}
            <Card>
              <CardHeader>
                <CardTitle>Estimate Summary</CardTitle>
                <CardDescription>
                  Created on {createdAt ? format(new Date(createdAt), 'PPP') : 'Unknown date'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Estimate PDF frame or download button */}
                {estimate.pdfURL ? (
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden h-[600px]">
                      <iframe 
                        src={estimate.pdfURL} 
                        className="w-full h-full"
                        title={title}
                      />
                    </div>
                    <div className="flex justify-center">
                      <a href={estimate.pdfURL} target="_blank" rel="noopener noreferrer">
                        <Button>
                          <Download className="h-4 w-4 mr-2" />
                          Download Estimate
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Estimate items */}
                    {configJSON.items && configJSON.items.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Estimate Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[300px]">Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {configJSON.items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {item.name}
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                    )}
                                  </TableCell>
                                  <TableCell>{item.quantity || 1}</TableCell>
                                  <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency((item.quantity || 1) * (item.unitPrice || 0))}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(subtotal)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={3} className="text-right">GST</TableCell>
                                <TableCell className="text-right">{formatCurrency(gst)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Simple estimate if no items */}
                    {(!configJSON.items || configJSON.items.length === 0) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>GST</span>
                              <span>{formatCurrency(gst)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span>{formatCurrency(total)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Payment milestones */}
            {milestoneBreakdown && milestoneBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Schedule</CardTitle>
                  <CardDescription>
                    This project will be billed according to the following schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Milestone</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {milestoneBreakdown.map((milestone: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {milestone.name}
                            {milestone.description && (
                              <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
                            )}
                          </TableCell>
                          <TableCell>{milestone.percentage}%</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency((milestone.percentage / 100) * total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            
            {/* Notes or additional details */}
            {configJSON.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p>{configJSON.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {estimate.pdfURL && (
                  <a href={estimate.pdfURL} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Estimate
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
                    <p className="font-medium">{status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {createdAt ? format(new Date(createdAt), 'PP') : 'Unknown'}
                    </p>
                  </div>
                  {updatedAt && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{format(new Date(updatedAt), 'PPp')}</p>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST</span>
                    <span>{formatCurrency(gst)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 list-disc list-inside">
                  <li>This estimate is valid for 30 days</li>
                  <li>Prices may change based on final specifications</li>
                  <li>Additional costs may apply for changes beyond the scope</li>
                </ul>
              </CardContent>
              <CardFooter className="text-xs text-gray-500">
                {estimate.createdAt ? `Estimate created on ${format(new Date(estimate.createdAt), 'PPP')}` : ''}
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}