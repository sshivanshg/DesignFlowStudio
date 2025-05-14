import React from 'react';
import { useClientActivities, ACTIVITY_TYPES, formatActivityMessage, ActivityType } from '@/hooks/useClientActivities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface ActivityItemProps {
  activity: ActivityType;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const typeInfo = ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES] || {
    icon: 'Activity',
    color: 'bg-gray-100 text-gray-700'
  };
  
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[typeInfo.icon] || LucideIcons.Activity;
  
  // Format date
  const createdAtDate = activity.createdAt ? new Date(activity.createdAt) : new Date();
  const relativeTime = formatDistanceToNow(createdAtDate, { addSuffix: true });
  const fullDate = format(createdAtDate, 'PPp'); // Localized date and time
  
  return (
    <div className="flex space-x-3 pb-4 last:pb-0 pt-4 first:pt-0 border-t first:border-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${typeInfo.color} flex-shrink-0`}>
        <IconComponent className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="text-sm text-gray-900 leading-none">
              <span className="font-medium">{activity.type.split('_')[0]}</span>{' '}
              <span className="text-gray-500 font-normal">{formatActivityMessage(activity)}</span>
            </div>
            <div 
              className="text-xs text-gray-500" 
              title={fullDate}
            >
              {relativeTime}
            </div>
          </div>
        </div>
        {activity.metadata && typeof activity.metadata === 'object' && Object.keys(activity.metadata as object).length > 0 && (
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
            {(activity.metadata as any)?.comment && (
              <div className="italic">"{(activity.metadata as any).comment}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ClientActivityListProps {
  clientId?: number;
  limit?: number;
  title?: string;
  className?: string;
}

const ClientActivityList: React.FC<ClientActivityListProps> = ({
  clientId,
  limit = 5,
  title = "Recent Activity",
  className = ""
}) => {
  const { activities, isLoading } = useClientActivities(clientId);
  
  // Only show the latest activities based on limit
  const displayActivities = activities.slice(0, limit);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading activities...</span>
          </div>
        ) : displayActivities.length > 0 ? (
          <ScrollArea className="h-[300px] px-6">
            <div className="space-y-0 divide-y divide-gray-100">
              {displayActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 px-6">
            <p className="text-sm text-gray-500">No recent activities</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientActivityList;