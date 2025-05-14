import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Activity } from '@shared/schema';

export interface ActivityType extends Activity {
  clientName?: string;
  projectName?: string;
}

export function useClientActivities(clientId?: number) {
  // Fetch client activities
  const {
    data: activities = [],
    isLoading,
    isError,
    error,
  } = useQuery<ActivityType[]>({
    queryKey: clientId ? [`/api/clients/${clientId}/activities`] : ['/api/dashboard/recent-activities'],
    enabled: true,
  });

  // Create a new activity
  const createActivity = useMutation({
    mutationFn: (activityData: {
      client_id?: number;
      project_id?: number;
      type: string;
      description: string;
      metadata?: Record<string, any>;
    }) => apiRequest('POST', '/api/activities', activityData),
    onSuccess: () => {
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/activities`] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
    },
  });

  return {
    activities,
    isLoading,
    isError,
    error,
    createActivity,
  };
}

// Activity type icons and colors
export const ACTIVITY_TYPES = {
  'client_added': { icon: 'UserPlus', color: 'bg-green-100 text-green-700' },
  'client_updated': { icon: 'UserCog', color: 'bg-blue-100 text-blue-700' },
  'project_created': { icon: 'FolderPlus', color: 'bg-purple-100 text-purple-700' },
  'proposal_created': { icon: 'FileText', color: 'bg-indigo-100 text-indigo-700' },
  'proposal_approved': { icon: 'CheckCircle', color: 'bg-green-100 text-green-700' },
  'estimate_created': { icon: 'Calculator', color: 'bg-amber-100 text-amber-700' },
  'moodboard_created': { icon: 'Image', color: 'bg-pink-100 text-pink-700' },
  'moodboard_viewed': { icon: 'Eye', color: 'bg-gray-100 text-gray-700' },
  'comment_added': { icon: 'MessageSquare', color: 'bg-blue-100 text-blue-700' },
  'changes_requested': { icon: 'RefreshCcw', color: 'bg-orange-100 text-orange-700' },
  'lead_converted': { icon: 'UserCheck', color: 'bg-teal-100 text-teal-700' },
  'log_added': { icon: 'PenTool', color: 'bg-violet-100 text-violet-700' },
  'photo_added': { icon: 'Camera', color: 'bg-rose-100 text-rose-700' },
  'portal_access_granted': { icon: 'Key', color: 'bg-cyan-100 text-cyan-700' },
  'message_sent': { icon: 'Send', color: 'bg-sky-100 text-sky-700' },
  'payment_received': { icon: 'CreditCard', color: 'bg-emerald-100 text-emerald-700' },
};

// Helper function to format activity message
export function formatActivityMessage(activity: ActivityType): string {
  const clientName = activity.clientName || `Client ${activity.client_id || 'Unknown'}`;
  const projectName = activity.projectName || `Project ${activity.project_id || 'Unknown'}`;
  
  switch (activity.type) {
    case 'client_added':
      return `New client ${clientName} was added`;
    case 'client_updated':
      return `${clientName} information was updated`;
    case 'project_created':
      return `New project created for ${clientName}`;
    case 'proposal_created':
      return `Proposal created for ${clientName}`;
    case 'proposal_approved':
      return `${clientName} approved the proposal${activity.project_id ? ` for ${projectName}` : ''}`;
    case 'estimate_created':
      return `Estimate created for ${clientName}`;
    case 'comment_added':
      return `${clientName} left a comment${activity.project_id ? ` on ${projectName}` : ''}`;
    case 'changes_requested':
      return `${clientName} requested changes${activity.project_id ? ` to ${projectName}` : ''}`;
    case 'lead_converted':
      return `Lead converted to client ${clientName}`;
    case 'portal_access_granted':
      return `${clientName} was granted portal access`;
    default:
      return activity.description || 'Activity recorded';
  }
}