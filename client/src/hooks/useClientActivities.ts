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
export function formatActivityMessage(activity: ActivityType): React.ReactNode {
  const clientName = activity.clientName || `Client ${activity.client_id || 'Unknown'}`;
  const projectName = activity.projectName || `Project ${activity.project_id || 'Unknown'}`;
  
  switch (activity.type) {
    case 'client_added':
      return (
        <>
          <span className="font-medium">New client</span>{' '}
          <span className="text-gray-500 font-normal">{clientName} was added</span>
        </>
      );
    case 'client_updated':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">information was updated</span>
        </>
      );
    case 'project_created':
      return (
        <>
          <span className="font-medium">New project</span>{' '}
          <span className="text-gray-500 font-normal">created for {clientName}</span>
        </>
      );
    case 'proposal_created':
      return (
        <>
          <span className="font-medium">Proposal</span>{' '}
          <span className="text-gray-500 font-normal">created for {clientName}</span>
        </>
      );
    case 'proposal_approved':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">approved the proposal</span>
          {activity.project_id && (
            <span className="text-gray-500 font-normal"> for {projectName}</span>
          )}
        </>
      );
    case 'estimate_created':
      return (
        <>
          <span className="font-medium">Estimate</span>{' '}
          <span className="text-gray-500 font-normal">created for {clientName}</span>
        </>
      );
    case 'comment_added':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">left a comment</span>
          {activity.project_id && (
            <span className="text-gray-500 font-normal"> on {projectName}</span>
          )}
        </>
      );
    case 'changes_requested':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">requested changes</span>
          {activity.project_id && (
            <span className="text-gray-500 font-normal"> to {projectName}</span>
          )}
        </>
      );
    case 'lead_converted':
      return (
        <>
          <span className="font-medium">Lead converted</span>{' '}
          <span className="text-gray-500 font-normal">to client {clientName}</span>
        </>
      );
    case 'portal_access_granted':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">was granted portal access</span>
        </>
      );
    default:
      return (
        <span className="text-gray-500 font-normal">{activity.description}</span>
      );
  }
}