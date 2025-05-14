import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ClientPortalAccessProps {
  client: {
    id: number;
    name: string;
    email: string;
    portal_access?: boolean;
    last_login?: string | Date | null;
  };
  onClientUpdate?: () => void;
}

export default function ClientPortalAccess({ client, onClientUpdate }: ClientPortalAccessProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalEnabled, setPortalEnabled] = useState(!!client.portal_access);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Format last login date
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString();
  };

  // Toggle portal access
  const togglePortalMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('PATCH', `/api/clients/${client.id}`, { portal_access: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      if (onClientUpdate) onClientUpdate();
      
      toast({
        title: portalEnabled ? "Portal Access Enabled" : "Portal Access Disabled",
        description: portalEnabled 
          ? `${client.name} now has access to the client portal`
          : `${client.name} no longer has access to the client portal`,
      });
    },
    onError: (error) => {
      console.error("Error toggling portal access:", error);
      // Revert UI state on error
      setPortalEnabled(!portalEnabled);
      
      toast({
        title: "Error",
        description: "Failed to update portal access. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate login token and send email
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/client-portal/generate-token', { 
        clientId: client.id,
        clientEmail: client.email
      });
    },
    onSuccess: () => {
      toast({
        title: "Login Link Sent",
        description: `A login link has been sent to ${client.email}`,
      });
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Error generating login token:", error);
      toast({
        title: "Error",
        description: "Failed to send login link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTogglePortalAccess = () => {
    const newValue = !portalEnabled;
    setPortalEnabled(newValue);
    togglePortalMutation.mutate(newValue);
  };

  const handleSendLoginLink = () => {
    generateTokenMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="h-4 w-4 mr-2" />
          Portal Access
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Client Portal Access</DialogTitle>
          <DialogDescription>
            Configure portal access for {client.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="portal-access" className="text-base">Enable Portal Access</Label>
              <p className="text-sm text-gray-500">
                Allow client to view their projects, proposals, and more
              </p>
            </div>
            <Switch 
              id="portal-access" 
              checked={portalEnabled} 
              onCheckedChange={handleTogglePortalAccess}
              disabled={togglePortalMutation.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status</span>
              <Badge variant={client.portal_access ? "default" : "outline"} 
                className={client.portal_access ? "bg-green-500 hover:bg-green-600" : ""}>
                {client.portal_access ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Last Login</span>
              <span className="text-sm">{formatDate(client.last_login)}</span>
            </div>
          </div>
          
          {portalEnabled && (
            <div className="pt-2">
              <Button 
                onClick={handleSendLoginLink} 
                className="w-full"
                disabled={generateTokenMutation.isPending}
              >
                <Mail className="h-4 w-4 mr-2" />
                {generateTokenMutation.isPending ? "Sending..." : "Send Login Link"}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This will send an email with a login link to {client.email}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}