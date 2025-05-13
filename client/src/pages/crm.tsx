import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus,
  Filter,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LeadColumn } from '@/components/crm/LeadColumn';
import { LeadForm } from '@/components/crm/LeadForm';
import { LeadFilters } from '@/components/crm/LeadFilters';
import { CRMProvider, LEAD_STAGES, useCRM } from '@/contexts/CRMContext';
import { useLeads, type LeadType } from '@/hooks/useLeads';
import { format } from 'date-fns';

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-muted-foreground">
              {leads.length} leads in your pipeline • Last updated {format(new Date(), 'MMM d, yyyy')}
            </p>
          </div>
          <Button onClick={() => setIsAddLeadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
        
        <LeadFilters />
      </div>
      
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-[calc(100vh-250px)]">
          {Object.entries(LEAD_STAGES).map(([stageName, stageKey]) => (
            <LeadColumn
              key={stageKey}
              title={stageName.charAt(0) + stageName.slice(1).toLowerCase()}
              stage={stageKey}
              leads={filteredLeadsByStage[stageKey] || []}
              onDrop={handleDrop}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
            />
          ))}
        </div>
      </DndProvider>
      
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