import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { 
  FilePlus, 
  Calendar, 
  Search, 
  Download, 
  FileText, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Loader2,
  Calculator,
  Share,
  Trash,
  BrainCircuit
} from 'lucide-react';

// Status badge colors
const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  template: 'bg-purple-100 text-purple-800',
};

export default function EstimatesPage() {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  // Fetch estimates
  const { data: estimates, isLoading, isError } = useQuery({
    queryKey: ['/api/estimates'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/estimates');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching estimates:", error);
        throw error;
      }
    }
  });

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Filter and sort estimates
  const getFilteredAndSortedEstimates = () => {
    if (!estimates || !Array.isArray(estimates)) {
      return [];
    }

    // Filter by status
    let filteredEstimates = estimates;
    if (statusFilter !== 'all') {
      filteredEstimates = estimates.filter((estimate) => estimate.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredEstimates = filteredEstimates.filter(
        (estimate) => 
          (estimate.title && estimate.title.toLowerCase().includes(searchLower)) ||
          (estimate.lead_id && estimate.lead_id.toString().includes(searchLower)) ||
          (estimate.client_id && estimate.client_id.toString().includes(searchLower))
      );
    }

    // Sort estimates
    const sortedEstimates = [...filteredEstimates].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (aValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue).getTime() - new Date(bValue).getTime() 
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }
      
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sortedEstimates;
  };

  const filteredEstimates = getFilteredAndSortedEstimates();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading estimates...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Error loading estimates. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Estimates</h1>
          <p className="text-muted-foreground">Manage and track all your project estimates</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/estimates/ai')} className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200">
            <BrainCircuit className="mr-2 h-4 w-4 text-blue-600" />
            AI Smart Estimate
          </Button>
          <Button onClick={() => navigate('/estimates/create')}>
            <Calculator className="mr-2 h-4 w-4" />
            Create Estimate
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Estimate Templates</CardTitle>
          <CardDescription>
            Use templates to quickly create common estimate types
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredEstimates
            .filter(estimate => estimate.isTemplate)
            .slice(0, 3)
            .map(template => (
              <Card key={template.id} className="bg-muted/30">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{template.title}</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex justify-between items-center">
                    <Badge 
                      variant="outline" 
                      className={`${statusColors.template}`}
                    >
                      Template
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/estimate-template/${template.id}`)}>
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
          {filteredEstimates.filter(e => e.isTemplate).length === 0 && (
            <div className="col-span-3 flex items-center justify-center h-24 border border-dashed rounded-md">
              <p className="text-muted-foreground">No templates available. Save an estimate as a template to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-white rounded-md shadow">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search estimates..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    Estimate Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort('total')}
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstimates
                .filter(estimate => !estimate.isTemplate)
                .map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="font-medium">{estimate.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {estimate.createdAt 
                        ? format(new Date(estimate.createdAt), 'MMM d, yyyy') 
                        : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${estimate.status && statusColors[estimate.status as keyof typeof statusColors]}`}
                    >
                      {estimate.status 
                        ? estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1) 
                        : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${estimate.total 
                      ? estimate.total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) 
                      : '0.00'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/estimates/${estimate.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(estimate.pdfURL || '#', '_blank')}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredEstimates.filter(e => !e.isTemplate).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No estimates found. 
                    <Button variant="link" onClick={() => navigate('/estimates/create')}>
                      Create your first estimate
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}