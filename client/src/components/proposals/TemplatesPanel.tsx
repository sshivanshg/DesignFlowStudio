import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'interior' | 'consulting' | 'renovation';
  thumbnail: string;
}

interface TemplatesPanelProps {
  onSelectTemplate: (template: Template) => void;
}

export function TemplatesPanel({ onSelectTemplate }: TemplatesPanelProps) {
  // Mock templates data
  const templates: Template[] = [
    {
      id: 'template-1',
      name: 'Modern Living Room',
      description: 'Clean lines and contemporary styling',
      category: 'interior',
      thumbnail: 'https://placehold.co/300x200/e5e7eb/a3a3a3?text=Living+Room+Template',
    },
    {
      id: 'template-2',
      name: 'Kitchen Renovation',
      description: 'Complete kitchen redesign template',
      category: 'renovation',
      thumbnail: 'https://placehold.co/300x200/e5e7eb/a3a3a3?text=Kitchen+Template',
    },
    {
      id: 'template-3',
      name: 'Design Consultation',
      description: 'Initial design consultation proposal',
      category: 'consulting',
      thumbnail: 'https://placehold.co/300x200/e5e7eb/a3a3a3?text=Consultation+Template',
    },
    {
      id: 'template-4',
      name: 'Bathroom Update',
      description: 'Bathroom renovation with pricing',
      category: 'renovation',
      thumbnail: 'https://placehold.co/300x200/e5e7eb/a3a3a3?text=Bathroom+Template',
    },
    {
      id: 'template-5',
      name: 'Home Office',
      description: 'Work from home space design',
      category: 'interior',
      thumbnail: 'https://placehold.co/300x200/e5e7eb/a3a3a3?text=Office+Template',
    },
    {
      id: 'template-6',
      name: 'Design Assessment',
      description: 'Multi-room assessment proposal',
      category: 'consulting',
      thumbnail: 'https://placehold.co/300x200/e5e7eb/a3a3a3?text=Assessment+Template',
    },
  ];

  return (
    <div className="p-4">
      <h2 className="font-semibold text-lg mb-4">Templates</h2>
      
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="interior">Interior</TabsTrigger>
          <TabsTrigger value="renovation">Renovation</TabsTrigger>
          <TabsTrigger value="consulting">Consulting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {templates.map((template) => (
            <TemplateCard 
              key={template.id}
              template={template}
              onSelect={() => onSelectTemplate(template)}
            />
          ))}
        </TabsContent>
        
        <TabsContent value="interior" className="space-y-4">
          {templates
            .filter(t => t.category === 'interior')
            .map((template) => (
              <TemplateCard 
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate(template)}
              />
            ))
          }
        </TabsContent>
        
        <TabsContent value="renovation" className="space-y-4">
          {templates
            .filter(t => t.category === 'renovation')
            .map((template) => (
              <TemplateCard 
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate(template)}
              />
            ))
          }
        </TabsContent>
        
        <TabsContent value="consulting" className="space-y-4">
          {templates
            .filter(t => t.category === 'consulting')
            .map((template) => (
              <TemplateCard 
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate(template)}
              />
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <div className="relative">
        <img 
          src={template.thumbnail} 
          alt={template.name} 
          className="w-full h-32 object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="capitalize">
            {template.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium mb-1">{template.name}</h3>
        <p className="text-sm text-gray-500">{template.description}</p>
      </CardContent>
    </Card>
  );
}