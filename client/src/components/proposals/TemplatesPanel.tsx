import React, { useState } from 'react';
import { Check, ExternalLink, LayoutTemplate, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Mock templates data - in a real app this would come from an API
const MOCK_TEMPLATES = [
  {
    id: 1,
    name: 'Modern Kitchen Design',
    category: 'Kitchen',
    thumbnailUrl: 'https://via.placeholder.com/150x200',
    sections: [
      {
        id: 'section-1',
        type: 'section',
        elements: [
          {
            id: 'element-1',
            type: 'heading',
            content: 'Modern Kitchen Design Proposal',
            position: { x: 50, y: 50 },
            size: { width: 500, height: 60 },
            style: { textAlign: 'center', fontSize: '24px' }
          },
          {
            id: 'element-2',
            type: 'text',
            content: 'A proposal for redesigning your kitchen with modern elements and functionality.',
            position: { x: 50, y: 120 },
            size: { width: 500, height: 100 },
            style: { textAlign: 'center' }
          }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Minimalist Living Room',
    category: 'Living',
    thumbnailUrl: 'https://via.placeholder.com/150x200',
    sections: [
      {
        id: 'section-1',
        type: 'section',
        elements: [
          {
            id: 'element-1',
            type: 'heading',
            content: 'Minimalist Living Room Design',
            position: { x: 50, y: 50 },
            size: { width: 500, height: 60 },
            style: { textAlign: 'center', fontSize: '24px' }
          }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Luxury Bedroom Suite',
    category: 'Bedroom',
    thumbnailUrl: 'https://via.placeholder.com/150x200',
    sections: [
      {
        id: 'section-1',
        type: 'section',
        elements: [
          {
            id: 'element-1',
            type: 'heading',
            content: 'Luxury Bedroom Suite Design',
            position: { x: 50, y: 50 },
            size: { width: 500, height: 60 },
            style: { textAlign: 'center', fontSize: '24px' }
          }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'Walk-in Wardrobe',
    category: 'Wardrobe',
    thumbnailUrl: 'https://via.placeholder.com/150x200',
    sections: [
      {
        id: 'section-1',
        type: 'section',
        elements: []
      }
    ]
  },
  {
    id: 5,
    name: 'Home Office Redesign',
    category: 'Office',
    thumbnailUrl: 'https://via.placeholder.com/150x200',
    sections: [
      {
        id: 'section-1',
        type: 'section',
        elements: []
      }
    ]
  }
];

interface TemplatesPanelProps {
  categories: string[];
  onSelectTemplate: (template: any) => void;
}

export function TemplatesPanel({ categories, onSelectTemplate }: TemplatesPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filter templates by category and search query
  const filteredTemplates = MOCK_TEMPLATES.filter(template => 
    (activeCategory === 'all' || template.category === activeCategory) &&
    (searchQuery === '' || template.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeCategory} 
        onValueChange={setActiveCategory}
        className="mt-4"
      >
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="all" className="flex-grow">All</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="flex-grow">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeCategory} className="mt-0">
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map(template => (
              <Card 
                key={template.id} 
                className="cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => onSelectTemplate(template)}
              >
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-gray-100 relative">
                    <img 
                      src={template.thumbnailUrl} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2">{template.category}</Badge>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{template.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No templates found for your search.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}