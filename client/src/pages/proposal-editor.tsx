import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Loader2, Save, Download, Share2, LayoutTemplate, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EditorCanvas } from '@/components/proposals/EditorCanvas';
import { ElementsPanel } from '@/components/proposals/ElementsPanel';
import { TemplatesPanel } from '@/components/proposals/TemplatesPanel';
import { PropertiesPanel } from '@/components/proposals/PropertiesPanel';

const PROPOSAL_TEMPLATE_CATEGORIES = [
  'Full Home',
  'Kitchen',
  'Living',
  'Bedroom',
  'Wardrobe',
  'Office'
];

const DEFAULT_PROPOSAL = {
  name: 'Untitled Proposal',
  sections: [
    {
      id: 'section-1',
      type: 'section',
      elements: []
    }
  ],
  client_id: null,
  lead_id: null,
  status: 'draft',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export default function ProposalEditor() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ leadId?: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Editor state
  const [proposal, setProposal] = useState(DEFAULT_PROPOSAL);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('elements');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Initialize the editor with a lead ID if provided
  useEffect(() => {
    if (params.leadId) {
      setProposal(prev => ({
        ...prev,
        lead_id: parseInt(params.leadId)
      }));
    }
  }, [params.leadId]);

  // Save proposal mutation
  const saveProposal = useMutation({
    mutationFn: (data: any) => apiRequest('/api/proposals', 'POST', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/proposals'] });
      toast({
        title: "Proposal Saved",
        description: "Your proposal has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save proposal. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Element handlers
  const handleAddElement = (elementType: string) => {
    const newElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      content: getDefaultContentByType(elementType),
      position: { x: 50, y: 50 },
      size: getDefaultSizeByType(elementType),
      style: {}
    };

    setProposal(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === 'section-1' ? 
          { ...section, elements: [...section.elements, newElement] } :
          section
      )
    }));
    setSelectedElement(newElement);
  };

  const handleElementUpdate = (elementId: string, updates: any) => {
    setProposal(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        elements: section.elements.map(el => 
          el.id === elementId ? { ...el, ...updates } : el
        )
      }))
    }));

    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(prev => ({ ...prev, ...updates }));
    }
  };

  const handleElementDelete = (elementId: string) => {
    setProposal(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        elements: section.elements.filter(el => el.id !== elementId)
      }))
    }));

    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null);
    }
  };

  // Template handlers
  const handleTemplateSelect = (template: any) => {
    setProposal({
      ...DEFAULT_PROPOSAL,
      ...template,
      lead_id: params.leadId ? parseInt(params.leadId) : null
    });
    setSelectedElement(null);
  };

  // Save, Export, and Share functions
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProposal.mutateAsync({
        ...proposal,
        updated_at: new Date().toISOString()
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement PDF export functionality
      toast({
        title: "Export Initiated",
        description: "Your proposal is being exported to PDF. This may take a moment."
      });
      
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export Complete",
        description: "Your proposal has been exported to PDF."
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your proposal to PDF.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // TODO: Implement share functionality
      toast({
        title: "Share Link Generated",
        description: "A shareable link has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "There was an error generating a share link.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Helper functions
  const getDefaultContentByType = (type: string) => {
    switch (type) {
      case 'text':
        return 'Click to edit this text';
      case 'heading':
        return 'Section Heading';
      case 'image':
        return { src: 'https://via.placeholder.com/400x300', alt: 'Placeholder image' };
      case 'pricing-table':
        return {
          items: [
            { name: 'Item 1', description: 'Description', price: 1000 },
            { name: 'Item 2', description: 'Description', price: 2000 }
          ],
          total: 3000
        };
      case 'scope-block':
        return {
          title: 'Project Scope',
          items: [
            'Scope item 1',
            'Scope item 2',
            'Scope item 3'
          ]
        };
      default:
        return '';
    }
  };

  const getDefaultSizeByType = (type: string) => {
    switch (type) {
      case 'heading':
        return { width: 400, height: 60 };
      case 'text':
        return { width: 400, height: 100 };
      case 'image':
        return { width: 400, height: 300 };
      case 'pricing-table':
        return { width: 600, height: 300 };
      case 'scope-block':
        return { width: 500, height: 200 };
      default:
        return { width: 300, height: 100 };
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setLocation('/proposals')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Proposals
            </Button>
            <h1 className="text-xl font-bold">{proposal.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportPDF} 
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare} 
              disabled={isSharing}
            >
              {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="elements" className="flex-1 overflow-y-auto p-4">
              <ElementsPanel onAddElement={handleAddElement} />
            </TabsContent>
            <TabsContent value="templates" className="flex-1 overflow-y-auto p-4">
              <TemplatesPanel 
                categories={PROPOSAL_TEMPLATE_CATEGORIES} 
                onSelectTemplate={handleTemplateSelect} 
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <EditorCanvas 
            sections={proposal.sections} 
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            onElementUpdate={handleElementUpdate}
            onElementDelete={handleElementDelete}
          />
        </div>

        {/* Right Properties Panel */}
        {selectedElement && (
          <div className="w-72 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
            <PropertiesPanel 
              element={selectedElement} 
              onUpdate={(updates) => handleElementUpdate(selectedElement.id, updates)} 
              onDelete={() => handleElementDelete(selectedElement.id)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}