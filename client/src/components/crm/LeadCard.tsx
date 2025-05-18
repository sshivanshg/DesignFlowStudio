import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { 
  Phone, 
  Mail, 
  AlertCircle, 
  Calendar, 
  MoreHorizontal, 
  Tag, 
  Calculator, 
  FileText, 
  FolderPlus,
  Check
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { LEAD_STAGES } from '@/contexts/CRMContext';
import type { LeadType } from '@/hooks/useLeads';

interface LeadCardProps {
  lead: LeadType;
  onEdit: (lead: LeadType) => void;
  onDelete: (id: number) => void;
}

const getTagColor = (tag: string | null) => {
  const colors: { [key: string]: string } = {
    'residential': 'bg-blue-100 text-blue-800',
    'commercial': 'bg-purple-100 text-purple-800',
    'renovation': 'bg-amber-100 text-amber-800',
    'new-build': 'bg-green-100 text-green-800',
    'consultation': 'bg-indigo-100 text-indigo-800',
    'high-priority': 'bg-red-100 text-red-800'
  };

  return tag && colors[tag] ? colors[tag] : 'bg-gray-100 text-gray-800';
};

const getSourceIcon = (source: string | null) => {
  const icons: { [key: string]: React.ReactNode } = {
    'website': <i className='bx bx-globe text-gray-500'></i>,
    'referral': <i className='bx bx-user-voice text-gray-500'></i>,
    'social-media': <i className='bx bxl-instagram text-gray-500'></i>,
    'advertisement': <i className='bx bx-purchase-tag text-gray-500'></i>,
    'cold-call': <i className='bx bx-phone-call text-gray-500'></i>,
    'event': <i className='bx bx-calendar-event text-gray-500'></i>
  };

  return source && icons[source] ? icons[source] : <i className='bx bx-question-mark text-gray-500'></i>;
};

export function LeadCard({ lead, onEdit, onDelete }: LeadCardProps) {
  const [_, navigate] = useLocation();
  const hasFollowUp = !!lead.followUpDate;
  const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : null;
  const isFollowUpOverdue = followUpDate && followUpDate < new Date();

  const navigateToEstimate = () => {
    navigate(`/estimate/${lead.id}`);
  };

  const navigateToProposalEditor = () => {
    navigate(`/proposal-editor?leadId=${lead.id}`);
  };

  const [isConvertToProjectOpen, setIsConvertToProjectOpen] = useState(false);
  const [convertingToProject, setConvertingToProject] = useState(false);

  const { toast } = useToast();

  const convertToProject = async () => {
    setConvertingToProject(true);
    try {
      // Get client info from lead if available
      const clientData = {
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone || "",
        notes: lead.notes || ""
      };

      // Create project API call
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `Project for ${lead.name}`,
          description: lead.notes || "",
          lead_id: lead.id,
          status: "active"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      // Update lead stage to CLOSED
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stage: "closed" // Using string directly to avoid circular dependency
        })
      });

      toast({
        title: "Project Created",
        description: "Lead has been converted to a project successfully",
      });

      // Close dialog and redirect to projects page
      setIsConvertToProjectOpen(false);
      navigate("/projects");
    } catch (error) {
      console.error("Error converting lead to project:", error);
      toast({
        title: "Error",
        description: "Failed to convert lead to project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConvertingToProject(false);
    }
  };

  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 cursor-move">
      <CardHeader className="p-3 pb-0 flex flex-row justify-between items-start">
        <div>
          <h3 className="font-semibold text-base">{lead.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            {getSourceIcon(lead.source)}
            <span className="ml-1 text-xs">
              {lead.source ? lead.source.replace('-', ' ') : 'Unknown source'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigateToEstimate}>
                  <Calculator className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Estimate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={navigateToProposalEditor}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Proposal</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => setIsConvertToProjectOpen(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Convert to Project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(lead)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={navigateToEstimate}>
                <Calculator className="h-4 w-4 mr-2" />
                Create Estimate
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={() => onDelete(lead.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-2">
        <div className="grid gap-2">
          {lead.phone && (
            <div className="flex items-center text-sm">
              <Phone className="h-3.5 w-3.5 mr-2 text-gray-500" />
              <span>{lead.phone}</span>
            </div>
          )}

          {lead.email && (
            <div className="flex items-center text-sm truncate">
              <Mail className="h-3.5 w-3.5 mr-2 text-gray-500" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}

          {lead.tag && (
            <div className="flex items-center text-sm">
              <Tag className="h-3.5 w-3.5 mr-2 text-gray-500" />
              <Badge variant="outline" className={`text-xs px-2 py-0 ${getTagColor(lead.tag)}`}>
                {lead.tag.replace('-', ' ')}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center">
          {hasFollowUp && lead.followUpDate && (
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span className={isFollowUpOverdue ? 'text-red-500 font-medium' : ''}>
                {(() => {
                  try {
                    const date = new Date(lead.followUpDate);
                    if (isNaN(date.getTime())) return 'Invalid date';
                    return formatDistanceToNow(date, { addSuffix: true });
                  } catch (error) {
                    return 'Invalid date';
                  }
                })()}
              </span>
              {isFollowUpOverdue && (
                <AlertCircle className="h-3.5 w-3.5 ml-1 text-red-500" />
              )}
            </div>
          )}
        </div>

        <div>
          {lead.createdAt && (
            <span>
              {(() => {
                try {
                  const date = new Date(lead.createdAt);
                  if (isNaN(date.getTime())) return 'Invalid date';
                  return `Added ${formatDistanceToNow(date, { addSuffix: true })}`;
                } catch (error) {
                  return 'Invalid date';
                }
              })()}
            </span>
          )}
        </div>
      </CardFooter>

      {/* Convert to Project Dialog */}
      <Dialog open={isConvertToProjectOpen} onOpenChange={setIsConvertToProjectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert Lead to Project</DialogTitle>
            <DialogDescription>
              This will create a new project based on this lead and mark the lead as closed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Lead Information</h4>
              <dl className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                <dt className="text-muted-foreground">Name:</dt>
                <dd>{lead.name}</dd>

                {lead.email && (
                  <>
                    <dt className="text-muted-foreground">Email:</dt>
                    <dd>{lead.email}</dd>
                  </>
                )}

                {lead.phone && (
                  <>
                    <dt className="text-muted-foreground">Phone:</dt>
                    <dd>{lead.phone}</dd>
                  </>
                )}

                {lead.source && (
                  <>
                    <dt className="text-muted-foreground">Source:</dt>
                    <dd>{lead.source.replace('-', ' ')}</dd>
                  </>
                )}
              </dl>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Project Details</h4>
              <p className="text-sm text-muted-foreground">
                A new project will be created with the name "Project for {lead.name}".
                You can edit the project details after creation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertToProjectOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={convertToProject} 
              disabled={convertingToProject}
              className="gap-2"
            >
              {convertingToProject ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Convert to Project</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}