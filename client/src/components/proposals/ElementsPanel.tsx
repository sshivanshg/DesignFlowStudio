import React from 'react';
import { 
  Type, 
  Heading1, 
  Image, 
  Table2, 
  ListChecks 
} from 'lucide-react';
import { ElementType } from '@/pages/proposal-editor';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Export element types for DnD
export const ELEMENT_TYPES = ['text', 'heading', 'image', 'pricingTable', 'scopeBlock'];

interface ElementsPanelProps {
  onAddElement: (type: ElementType) => void;
}

function ElementsPanel({ onAddElement }: ElementsPanelProps) {
  const elements = [
    {
      type: 'heading' as ElementType,
      name: 'Heading',
      description: 'Large title text',
      icon: <Heading1 className="h-5 w-5 mr-2" />,
    },
    {
      type: 'text' as ElementType,
      name: 'Text',
      description: 'Regular paragraph text',
      icon: <Type className="h-5 w-5 mr-2" />,
    },
    {
      type: 'image' as ElementType,
      name: 'Image',
      description: 'Add photos and graphics',
      icon: <Image className="h-5 w-5 mr-2" />,
    },
    {
      type: 'pricingTable' as ElementType,
      name: 'Pricing Table',
      description: 'Show services and prices',
      icon: <Table2 className="h-5 w-5 mr-2" />,
    },
    {
      type: 'scopeBlock' as ElementType,
      name: 'Scope Block',
      description: 'List project deliverables',
      icon: <ListChecks className="h-5 w-5 mr-2" />,
    },
  ];

  return (
    <div className="p-4">
      <h2 className="font-semibold text-lg mb-4">Add Elements</h2>
      <div className="space-y-3">
        {elements.map((element, index) => (
          <React.Fragment key={element.type}>
            <div
              className="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onAddElement(element.type)}
            >
              <div className="text-primary">
                {element.icon}
              </div>
              <div>
                <h3 className="font-medium">{element.name}</h3>
                <p className="text-sm text-gray-500">{element.description}</p>
              </div>
            </div>
            {index < elements.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>
      
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Tips</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Drag elements to position them</li>
          <li>• Double-click text to edit</li>
          <li>• Use the properties panel to style elements</li>
        </ul>
      </div>
    </div>
  );
};

export { ElementsPanel };