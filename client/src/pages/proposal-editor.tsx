import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ChevronLeft, Save, Upload, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Components
import { ElementsPanel } from '@/components/proposals/ElementsPanel';
import { TemplatesPanel } from '@/components/proposals/TemplatesPanel';
import { EditorCanvas } from '@/components/proposals/EditorCanvas';
import { PropertiesPanel } from '@/components/proposals/PropertiesPanel';

// Define types for our proposal elements
export type ElementType = 'text' | 'heading' | 'image' | 'pricingTable' | 'scopeBlock';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  style?: React.CSSProperties;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
}

export interface HeadingElement extends BaseElement {
  type: 'heading';
  content: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  content: {
    src: string;
    alt: string;
  };
}

export interface PricingTableElement extends BaseElement {
  type: 'pricingTable';
  content: {
    items: {
      name: string;
      description: string;
      price: number;
    }[];
    total: number;
  };
}

export interface ScopeBlockElement extends BaseElement {
  type: 'scopeBlock';
  content: {
    title: string;
    items: string[];
  };
}

export type ProposalElement = 
  | TextElement 
  | HeadingElement 
  | ImageElement 
  | PricingTableElement 
  | ScopeBlockElement;

export interface Proposal {
  id?: number;
  title: string;
  elements: ProposalElement[];
  client_id?: number | null;
  lead_id?: number | null;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  dataJSON?: string; // JSON string to store all the proposal data in the database
}

const ProposalEditor: React.FC = () => {
  const { leadId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [title, setTitle] = useState<string>('Untitled Proposal');
  const [elements, setElements] = useState<ProposalElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<ProposalElement | null>(null);
  const [activePanel, setActivePanel] = useState<'elements' | 'templates'>('elements');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // If we have a leadId, fetch lead data and set any initial proposal data
    if (leadId) {
      // This would fetch lead data to populate client information
      // For now, we'll just set a title with the lead ID
      setTitle(`Proposal for Lead #${leadId}`);
    }
  }, [leadId]);

  const handleAddElement = (type: ElementType) => {
    const newElement = createDefaultElement(type);
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement);
  };
  
  const handleSelectElement = (elementId: string | null) => {
    if (elementId === null) {
      setSelectedElement(null);
    } else {
      const element = elements.find(el => el.id === elementId);
      if (element) {
        setSelectedElement(element);
      }
    }
  };
  
  const handleUpdateElement = (updatedElement: ProposalElement) => {
    setElements(prev => 
      prev.map(el => el.id === updatedElement.id ? updatedElement : el)
    );
    
    // Also update the selected element if it's the one being updated
    if (selectedElement && selectedElement.id === updatedElement.id) {
      setSelectedElement(updatedElement);
    }
  };
  
  const handleDeleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    
    // Deselect if the deleted element was selected
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(null);
    }
  };

  const handleSaveProposal = async () => {
    if (!user) {
      toast({
        title: "Authorization Error",
        description: "You must be logged in to save proposals",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const proposalData: Proposal = {
        title,
        elements,
        status: 'draft',
        // Store all element data in dataJSON field as that's what the database expects
        dataJSON: JSON.stringify({
          elements,
          version: '1.0'
        })
      };
      
      if (leadId) {
        proposalData.lead_id = parseInt(leadId);
      }
      
      // Make the actual API call to save the proposal
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
      }
      
      const savedProposal = await response.json();
      console.log('Proposal saved successfully:', savedProposal);
      
      toast({
        title: "Proposal Saved",
        description: "Your proposal has been saved successfully",
      });
      
      // Redirect to the proposals list after successful save
      setTimeout(() => {
        setLocation('/proposals');
      }, 1500);
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        title: "Error Saving",
        description: "There was an error saving your proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setLocation('/proposals');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="ml-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-medium focus:outline-none border-0 focus:border-b focus:border-gray-300 px-1"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled={isSaving}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button variant="outline" size="sm" disabled={isSaving}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm" disabled={isSaving}>
            <Upload className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button variant="default" size="sm" onClick={handleSaveProposal} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 flex flex-col border-r bg-white">
          <div className="border-b">
            <div className="flex">
              <Button
                variant={activePanel === 'elements' ? 'default' : 'ghost'}
                className="flex-1 rounded-none"
                onClick={() => setActivePanel('elements')}
              >
                Elements
              </Button>
              <Button
                variant={activePanel === 'templates' ? 'default' : 'ghost'}
                className="flex-1 rounded-none"
                onClick={() => setActivePanel('templates')}
              >
                Templates
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'elements' ? (
              <ElementsPanel onAddElement={handleAddElement} />
            ) : (
              <TemplatesPanel onSelectTemplate={(template) => console.log('Template selected:', template)} />
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center">
          <EditorCanvas
            elements={elements}
            selectedElementId={selectedElement?.id || null}
            onSelectElement={handleSelectElement}
            onUpdateElement={handleUpdateElement}
            onAddElement={(element) => {
              setElements(prev => [...prev, element]);
              setSelectedElement(element);
            }}
          />
        </div>

        {/* Right sidebar */}
        {selectedElement && (
          <div className="w-64 border-l bg-white overflow-y-auto">
            <PropertiesPanel
              element={selectedElement}
              onChange={handleUpdateElement}
              onDelete={() => handleDeleteElement(selectedElement.id)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to create default elements based on type
function createDefaultElement(type: ElementType): ProposalElement {
  const baseElement = {
    id: Math.random().toString(36).substr(2, 9),
    x: 50,
    y: 50,
    width: 300,
    height: type === 'heading' ? 80 : type === 'text' ? 150 : 200,
    zIndex: Date.now(),
  };

  switch (type) {
    case 'text':
      return {
        ...baseElement,
        type: 'text',
        content: 'Click to edit this text. This is a paragraph that can contain multiple lines of text content for your proposal.',
      };
    case 'heading':
      return {
        ...baseElement,
        type: 'heading',
        content: 'Heading Text',
      };
    case 'image':
      return {
        ...baseElement,
        type: 'image',
        width: 400,
        height: 300,
        content: {
          src: '',
          alt: 'Image description',
        },
      };
    case 'pricingTable':
      return {
        ...baseElement,
        type: 'pricingTable',
        width: 500,
        height: 300,
        content: {
          items: [
            { name: 'Item 1', description: 'Description for item 1', price: 1000 },
            { name: 'Item 2', description: 'Description for item 2', price: 1500 },
          ],
          total: 2500,
        },
      };
    case 'scopeBlock':
      return {
        ...baseElement,
        type: 'scopeBlock',
        width: 500,
        height: 250,
        content: {
          title: 'Project Scope',
          items: [
            'Initial consultation and space planning',
            'Material selection and sourcing',
            'Project management and coordination',
          ],
        },
      };
    default:
      throw new Error(`Unknown element type: ${type}`);
  }
}

export default ProposalEditor;