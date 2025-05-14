import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";

// Function to generate a consistent color based on a string (name)
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

// Function to get initials from a name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Function to format the activity message
const formatActivityMessage = (activity: Activity) => {
  const clientName = `Client ${activity.client_id || 'Unknown'}`;
  
  switch (activity.type) {
    case 'proposal_approved':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">approved the proposal</span>
          {activity.project_id && (
            <span className="text-gray-500 font-normal"> for Project {activity.project_id}</span>
          )}
        </>
      );
    case 'comment_added':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">left a comment</span>
          {activity.project_id && (
            <span className="text-gray-500 font-normal"> on Project {activity.project_id}</span>
          )}
        </>
      );
    case 'changes_requested':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">requested changes</span>
          {activity.project_id && (
            <span className="text-gray-500 font-normal"> to Project {activity.project_id}</span>
          )}
        </>
      );
    case 'viewed_moodboard':
      return (
        <>
          <span className="font-medium">{clientName}</span>{' '}
          <span className="text-gray-500 font-normal">viewed the moodboard</span>
          {activity.project_id && (
            <span className="text-gray-500 font-normal"> for Project {activity.project_id}</span>
          )}
        </>
      );
    default:
      return <span className="text-gray-500 font-normal">{activity.description}</span>;
  }
};

export default function ClientActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${queryKey[0]}?limit=5`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      return response.json();
    }
  });

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return 'Recently';
    
    try {
      // Safely attempt to parse the date
      const parsedDate = new Date(date);
      
      // Check if the date is valid before formatting
      if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date value:', date);
        return 'Recently';
      }
      
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Client Activity</h3>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flow-root">
          <ul className="divide-y divide-gray-200">
            {isLoading ? (
              // Loading skeleton
              Array(4).fill(0).map((_, index) => (
                <li key={index} className="py-3 animate-pulse">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-1/4"></div>
                    </div>
                  </div>
                </li>
              ))
            ) : activities && activities.length > 0 ? (
              activities.map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback 
                        style={{ backgroundColor: stringToColor(`Client ${activity.client_id || 'Unknown'}`) }}
                        className="text-white"
                      >
                        {getInitials(`Client ${activity.client_id || 'Unknown'}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {formatActivityMessage(activity)}
                      </p>
                      
                      {activity.type === 'comment_added' && activity.metadata?.comment && (
                        <p className="text-xs bg-gray-50 text-gray-600 rounded p-2 mt-1 italic">
                          "{activity.metadata.comment}"
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-3">
                <p className="text-center text-gray-500">No recent client activity found.</p>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
