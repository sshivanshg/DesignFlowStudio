import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { LEAD_STAGES } from '@/contexts/CRMContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Lead } from '@shared/schema';

// Lead interface used on the frontend (camelCase)
export interface LeadType {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  stage: string;
  tag: string | null;
  assignedTo: number;
  notes: string | null;
  followUpDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function useLeads() {
  const { user } = useAuth();

  // Fetch all leads for the current user
  const {
    data: leads = [] as LeadType[],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['/api/leads'],
    enabled: !!user,
    // No need to define queryFn as the default fetcher is already set up
  });

  // Get leads grouped by stage
  const leadsByStage = Object.fromEntries(
    Object.values(LEAD_STAGES).map(stage => [
      stage,
      leads.filter((lead: LeadType) => lead.stage === stage)
    ])
  );

  // Create a new lead
  const createLead = useMutation({
    mutationFn: (leadData: Partial<LeadType>) => 
      apiRequest('POST', '/api/leads', leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });

  // Update a lead
  const updateLead = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<LeadType>) => 
      apiRequest('PATCH', `/api/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });

  // Delete a lead
  const deleteLead = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    },
  });

  // Update a lead's stage (for drag-and-drop)
  const updateLeadStage = async (leadId: number, newStage: string) => {
    return updateLead.mutateAsync({ 
      id: leadId, 
      stage: newStage 
    });
  };

  return {
    leads,
    leadsByStage,
    isLoading,
    isError,
    error,
    createLead,
    updateLead,
    deleteLead,
    updateLeadStage,
  };
}