import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLocation } from 'wouter';
import { 
  Plus,
  Filter,
  Loader2,
  RefreshCw,
  Users,
  BarChart,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LeadColumn } from '@/components/crm/LeadColumn';
import { LeadForm } from '@/components/crm/LeadForm';
import { LeadFilters } from '@/components/crm/LeadFilters';
import { LeadStageLabel } from '@/components/crm/LeadStageLabel';
import ClientActivityList from '@/components/crm/ClientActivityList';
import { CRMProvider, LEAD_STAGES, LEAD_SOURCES, LEAD_TAGS, useCRM } from '@/contexts/CRMContext';
import { useLeads, type LeadType } from '@/hooks/useLeads';
import { format, formatDistanceToNow } from 'date-fns';

function CRMDashboard() {
  const { toast } = useToast();
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const { activeFilters } = useCRM();

  const {
    leads,
    leadsByStage,
    isLoading,
    isError,
    createLead,
    updateLead,
    deleteLead,
    updateLeadStage,
  } = useLeads() as {
    leads: LeadType[];
    leadsByStage: Record<string, LeadType[]>;
    isLoading: boolean;
    isError: boolean;
    createLead: any;
    updateLead: any;
    deleteLead: any;
    updateLeadStage: (leadId: number, newStage: string) => Promise<any>;
  };

  // If loading or error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-150px)]">
        <div className="flex flex-col items-center">
          <div className="p-3 rounded-full bg-red-100">
            <RefreshCw className="h-8 w-8 text-red-600" />
          </div>
          <p className="mt-2 text-muted-foreground">Error loading leads. Please refresh and try again.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Filter leads based on active filters
  const getFilteredLeadsByStage = () => {
    // Start with all leads grouped by stage
    const filtered = { ...leadsByStage };

    // Apply search filter
    if (activeFilters.search) {
      const searchLowerCase = activeFilters.search.toLowerCase();
      
      // Filter each stage
      Object.keys(filtered).forEach(stage => {
        filtered[stage] = filtered[stage].filter((lead: LeadType) => 
          lead.name.toLowerCase().includes(searchLowerCase) ||
          (lead.email && lead.email.toLowerCase().includes(searchLowerCase)) ||
          (lead.phone && lead.phone.toLowerCase().includes(searchLowerCase)) ||
          (lead.notes && lead.notes.toLowerCase().includes(searchLowerCase))
        );
      });
    }

    // Apply tag filter
    if (activeFilters.tags.length > 0) {
      Object.keys(filtered).forEach(stage => {
        filtered[stage] = filtered[stage].filter((lead: LeadType) => 
          lead.tag && activeFilters.tags.includes(lead.tag)
        );
      });
    }

    // Apply source filter
    if (activeFilters.sources.length > 0) {
      Object.keys(filtered).forEach(stage => {
        filtered[stage] = filtered[stage].filter((lead: LeadType) => 
          lead.source && activeFilters.sources.includes(lead.source)
        );
      });
    }

    // Apply date range filter
    if (activeFilters.dateFrom || activeFilters.dateTo) {
      Object.keys(filtered).forEach(stage => {
        filtered[stage] = filtered[stage].filter((lead: LeadType) => {
          const leadDate = lead.createdAt ? new Date(lead.createdAt) : null;
          if (!leadDate) return false;
          
          const isAfterFrom = !activeFilters.dateFrom || leadDate >= activeFilters.dateFrom;
          const isBeforeTo = !activeFilters.dateTo || leadDate <= activeFilters.dateTo;
          
          return isAfterFrom && isBeforeTo;
        });
      });
    }

    // Apply assigned to me filter
    if (activeFilters.assignedToMe) {
      // This would require the current user's ID
      // For now, we'll just return all leads since we don't have user context here
    }

    return filtered;
  };

  const filteredLeadsByStage = getFilteredLeadsByStage();

  // Handle drag and drop to update lead stage
  const handleDrop = async (leadId: number, newStage: string) => {
    try {
      await updateLeadStage(leadId, newStage);
      toast({
        title: "Lead Updated",
        description: `Lead has been moved to ${newStage.charAt(0).toUpperCase() + newStage.slice(1)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead stage",
        variant: "destructive",
      });
    }
  };

  // Handle lead edit
  const handleEditLead = (lead: LeadType) => {
    setSelectedLead(lead);
    setIsEditLeadOpen(true);
  };

  // Handle lead deletion
  const handleDeleteLead = async (id: number) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      try {
        await deleteLead.mutateAsync(id);
        toast({
          title: "Lead Deleted",
          description: "Lead has been successfully deleted",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete lead",
          variant: "destructive",
        });
      }
    }
  };

  // Handle adding a new lead
  const handleAddLead = async (data: Partial<LeadType>) => {
    try {
      await createLead.mutateAsync(data);
      setIsAddLeadOpen(false);
      toast({
        title: "Lead Added",
        description: "New lead has been successfully added",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lead",
        variant: "destructive",
      });
    }
  };

  // Handle updating a lead
  const handleUpdateLead = async (data: Partial<LeadType>) => {
    if (!selectedLead) return;
    
    try {
      await updateLead.mutateAsync({
        id: selectedLead.id,
        ...data,
      });
      setIsEditLeadOpen(false);
      setSelectedLead(null);
      toast({
        title: "Lead Updated",
        description: "Lead has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const clientIdParam = urlParams.get('client');
  const initialTab = clientIdParam ? 'clients' : 'leads';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">CRM</h1>
            <p className="text-muted-foreground">
              {leads.length} leads in your pipeline • Last updated {format(new Date(), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation('/clients')}>
              <Users className="mr-2 h-4 w-4" />
              Client Directory
            </Button>
            <Button onClick={() => setIsAddLeadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="leads">Pipeline</TabsTrigger>
          <TabsTrigger value="clients">Client Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <LeadFilters />
          
          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-320px)] mt-6">
              {Object.entries(LEAD_STAGES).map(([stageName, stageKey]) => {
                // Format the title: "NEW" -> "New", "IN_DISCUSSION" -> "In Discussion"
                const formattedTitle = stageName === 'NEW' ? 'New' : 
                                      stageName === 'IN_DISCUSSION' ? 'In Discussion' :
                                      stageName === 'WON' ? 'Won' : 'Lost';
                
                return (
                  <LeadColumn
                    key={stageKey}
                    title={formattedTitle}
                    stage={stageKey}
                    leads={filteredLeadsByStage[stageKey] || []}
                    onDrop={handleDrop}
                    onEditLead={handleEditLead}
                    onDeleteLead={handleDeleteLead}
                  />
                );
              })}
            </div>
          </DndProvider>
        </TabsContent>
        
        <TabsContent value="clients">
          <div className="flex gap-6">
            <div className="w-2/3">
              <ClientActivityList 
                title="Recent Client Activity" 
                limit={10} 
                className="h-[calc(100vh-260px)]"
              />
            </div>
            <div className="w-1/3 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Upcoming Follow-ups</CardTitle>
                </CardHeader>
                <CardContent>
                  {leads.filter(lead => lead.followUpDate && new Date(lead.followUpDate) >= new Date()).length > 0 ? (
                    <div className="space-y-3">
                      {leads
                        .filter(lead => lead.followUpDate && new Date(lead.followUpDate) >= new Date())
                        .sort((a, b) => {
                          const dateA = new Date(a.followUpDate!);
                          const dateB = new Date(b.followUpDate!);
                          return dateA.getTime() - dateB.getTime();
                        })
                        .slice(0, 5)
                        .map(lead => (
                          <div key={lead.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                {lead.followUpDate && format(new Date(lead.followUpDate), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <LeadStageLabel stage={lead.stage} />
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No upcoming follow-ups</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">Leads by Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(LEAD_STAGES).map(([stageName, stageKey]) => (
                      <div key={stageKey} className="flex justify-between items-center">
                        <LeadStageLabel stage={stageKey} />
                        <p className="font-medium">{filteredLeadsByStage[stageKey]?.length || 0}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Lead Conversion Rate</CardTitle>
                <CardDescription>Past 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">
                  {leads.filter(lead => lead.stage === LEAD_STAGES.WON).length > 0
                    ? Math.round((leads.filter(lead => lead.stage === LEAD_STAGES.WON).length / leads.length) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-gray-500">
                  {leads.filter(lead => lead.stage === LEAD_STAGES.WON).length} of {leads.length} leads won
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Lead Source Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {LEAD_SOURCES.map((source: string) => {
                    const count = leads.filter(lead => lead.source === source).length;
                    const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
                    
                    return (
                      <div key={source} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{source.replace('-', ' ')}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Recent Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                {leads.filter(lead => lead.stage === LEAD_STAGES.WON).length > 0 ? (
                  <div className="space-y-4">
                    {leads
                      .filter(lead => lead.stage === LEAD_STAGES.WON)
                      .slice(0, 3)
                      .map(lead => (
                        <div key={lead.id} className="flex items-start">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-3 mt-0.5">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-gray-500">{lead.tag}</p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No conversions yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add Lead Dialog */}
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Create a new lead to add to your sales pipeline.
            </DialogDescription>
          </DialogHeader>
          <LeadForm 
            onSubmit={handleAddLead} 
            isSubmitting={createLead.isPending} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information and details.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <LeadForm 
              lead={selectedLead}
              onSubmit={handleUpdateLead} 
              isSubmitting={updateLead.isPending} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrap the dashboard with the CRM provider
export default function CRMPage() {
  return (
    <CRMProvider>
      <CRMDashboard />
    </CRMProvider>
  );
}