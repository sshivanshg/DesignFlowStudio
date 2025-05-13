import React from 'react';
import { 
  Type, 
  Heading, 
  Image, 
  Table, 
  ListTodo, 
  Plus,
  Table2,
  Text,
  LayoutList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ElementsPanelProps {
  onAddElement: (elementType: string) => void;
}

export function ElementsPanel({ onAddElement }: ElementsPanelProps) {
  const elementTypes = [
    { 
      type: 'heading', 
      icon: <Heading className="h-5 w-5" />, 
      label: 'Heading' 
    },
    { 
      type: 'text', 
      icon: <Text className="h-5 w-5" />, 
      label: 'Text Block' 
    },
    { 
      type: 'image', 
      icon: <Image className="h-5 w-5" />, 
      label: 'Image' 
    },
    { 
      type: 'pricing-table', 
      icon: <Table2 className="h-5 w-5" />, 
      label: 'Pricing Table' 
    },
    { 
      type: 'scope-block', 
      icon: <LayoutList className="h-5 w-5" />, 
      label: 'Scope Block' 
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Drag & Drop Elements</h3>
      <Separator />
      
      <div className="grid gap-2">
        {elementTypes.map((element) => (
          <Button
            key={element.type}
            variant="outline"
            className="justify-start h-auto py-3"
            onClick={() => onAddElement(element.type)}
          >
            <div className="flex items-center w-full">
              <div className="mr-3 text-primary">{element.icon}</div>
              <span>{element.label}</span>
              <div className="ml-auto">
                <Plus className="h-4 w-4" />
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <Separator className="mt-6" />
      
      <h3 className="text-sm font-medium mt-4">AI Assistant</h3>
      <Button className="w-full">
        <Type className="mr-2 h-4 w-4" />
        Generate Content
      </Button>
    </div>
  );
}