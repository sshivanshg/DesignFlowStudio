import { useQuery, useMutation } from "@tanstack/react-query";
// Task type from projects table
interface Task {
  id: string | number;
  title: string;
  description?: string;
  dueDate?: string | Date;
  completed?: boolean;
  assignedTo?: number;
  projectId?: number;
  projectName?: string;
}
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";

export default function UpcomingTasks() {
  const { data: tasks, isLoading } = useQuery<any[]>({
    queryKey: ['/api/dashboard/upcoming-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/upcoming-tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming tasks');
      }
      return response.json();
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/upcoming-tasks'] });
    },
  });

  const handleCheckboxChange = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { completed: !task.completed },
    });
  };

  const getFormattedDate = (dateString?: Date | string | null) => {
    if (!dateString) return "No date set";
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  const getFormattedTime = (dateString?: Date | string | null) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Upcoming Tasks</h3>
        <Button
          variant="link"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          + Add Task
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, index) => (
              <div key={index} className="flex items-start animate-pulse">
                <div className="mt-1 h-4 w-4 rounded bg-gray-200"></div>
                <div className="ml-3 space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : tasks && tasks.length > 0 ? (
            tasks
              .filter(task => !task.completed)
              .sort((a, b) => {
                if (!a.dueDate || !b.dueDate) return 0;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-start">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleCheckboxChange(task)}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs text-gray-500">
                        {getFormattedDate(task.dueDate)}
                      </span>
                      {task.dueDate && (
                        <>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-xs font-medium text-gray-700">
                            {getFormattedTime(task.dueDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-500">No upcoming tasks found. Add your first task to get started.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
