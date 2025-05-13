import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Client, Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ClientPortalAccess from "@/components/client-portal-access";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Building, 
  MapPin, 
  ChevronRight,
  Link2
} from "lucide-react";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  
  const { data: clients, isLoading: isClientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const getClientProjects = (clientId: number) => {
    if (!projects) return [];
    return projects.filter(project => project.client_id === clientId);
  };
  
  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Clients</h1>
        <p className="text-gray-500">Manage your client directory and project relationships</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search clients..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Client
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isClientsLoading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : filteredClients && filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const clientProjects = getClientProjects(client.id);
            
            return (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-14 w-14 mr-4">
                        <AvatarImage src={client.avatar || ""} alt={client.name} />
                        <AvatarFallback className="bg-primary text-white text-lg">
                          {client.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                          {client.portal_access && (
                            <Badge variant="outline" className="ml-2 text-xs" title="Has portal access">
                              <Link2 className="h-3 w-3 mr-1" />
                              Portal
                            </Badge>
                          )}
                        </div>
                        {client.company && (
                          <p className="text-sm text-gray-500">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClientPortalAccess 
                        client={client} 
                        onClientUpdate={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={`/crm?client=${client.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border-t border-gray-200 px-6 py-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-700">{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-gray-700">{client.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Projects</h4>
                      <span className="text-sm text-gray-500">{clientProjects.length}</span>
                    </div>
                    {clientProjects.length > 0 ? (
                      <div className="space-y-2">
                        {clientProjects.slice(0, 2).map((project) => (
                          <div key={project.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center text-gray-500 mr-2">
                                <Building className="h-4 w-4" />
                              </div>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-500">{project.status}</p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {project.progress}%
                            </div>
                          </div>
                        ))}
                        {clientProjects.length > 2 && (
                          <Button variant="link" className="text-sm pl-0" asChild>
                            <a href={`/clients/${client.id}`}>
                              View all {clientProjects.length} projects
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No projects yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            {searchQuery 
              ? `No clients matching "${searchQuery}"` 
              : "Add your first client to start managing projects and proposals."}
          </p>
          <Button className="mx-auto">
            <Plus className="mr-2 h-4 w-4" /> Add New Client
          </Button>
        </Card>
      )}
    </>
  );
}
