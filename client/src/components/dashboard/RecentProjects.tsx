import { useQuery } from "@tanstack/react-query";
import { Building, Store, Home, ExternalLink } from "lucide-react";
import { Project } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const getProjectIcon = (projectName: string) => {
  const name = projectName.toLowerCase();
  
  if (name.includes("apartment") || name.includes("home")) {
    return <Home className="text-xl" />;
  } else if (name.includes("restaurant") || name.includes("store")) {
    return <Store className="text-xl" />;
  } else {
    return <Building className="text-xl" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
    case "in_progress":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">In Progress</Badge>;
    case "planning":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Planning</Badge>;
    case "completed":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function RecentProjects() {
  const { data: recentProjects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/dashboard/recent-projects'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-projects');
      if (!response.ok) {
        throw new Error('Failed to fetch recent projects');
      }
      return response.json();
    }
  });

  return (
    <Card className="border border-gray-200">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Recent Projects</h3>
        <Button variant="link" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
                        <div className="ml-4 space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 animate-pulse"></div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : recentProjects && recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                          {getProjectIcon(project.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">{project.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {/* In a real app, we would fetch client details using the client_id */}
                        Client {project.client_id}
                      </div>
                      <div className="text-sm text-gray-500">client@example.com</div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {getStatusBadge(project.status || '')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Progress value={project.progress} className="h-2.5 w-full bg-gray-200" />
                        <span className="ml-2 text-xs text-gray-500">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                      <Button 
                        variant="link" 
                        className="text-primary-600 hover:text-primary-900"
                        size="sm"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                    No projects found. Create your first project to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
