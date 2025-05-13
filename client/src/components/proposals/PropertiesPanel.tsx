import React from 'react';
import { ProposalElement } from '@/pages/proposal-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PropertiesPanelProps {
  element: ProposalElement;
  onChange: (updatedElement: ProposalElement) => void;
  onDelete: () => void;
}

export function PropertiesPanel({ element, onChange, onDelete }: PropertiesPanelProps) {
  const handleStyleChange = (property: string, value: string | number) => {
    const updatedStyle = {
      ...element.style,
      [property]: value,
    };
    
    onChange({
      ...element,
      style: updatedStyle,
    });
  };

  const handleSizeChange = (property: 'width' | 'height', value: number) => {
    onChange({
      ...element,
      [property]: value,
    });
  };

  const renderContentEditor = () => {
    switch (element.type) {
      case 'text':
      case 'heading':
        return (
          <div className="space-y-3">
            <Label>Content</Label>
            <Textarea
              value={element.content}
              onChange={(e) => {
                onChange({
                  ...element,
                  content: e.target.value,
                });
              }}
              rows={5}
              className="resize-none"
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label>Image URL</Label>
              <Input
                value={element.content.src}
                onChange={(e) => {
                  onChange({
                    ...element,
                    content: {
                      ...element.content,
                      src: e.target.value,
                    },
                  });
                }}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input
                value={element.content.alt}
                onChange={(e) => {
                  onChange({
                    ...element,
                    content: {
                      ...element.content,
                      alt: e.target.value,
                    },
                  });
                }}
                placeholder="Description of the image"
                className="mt-1"
              />
            </div>
          </div>
        );
      
      case 'pricingTable':
        return (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Items</Label>
              {element.content.items.map((item, index) => (
                <div key={index} className="mb-4 p-3 border rounded-md">
                  <div className="mb-2">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const updatedItems = [...element.content.items];
                        updatedItems[index].name = e.target.value;
                        
                        onChange({
                          ...element,
                          content: {
                            ...element.content,
                            items: updatedItems,
                          },
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="mb-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => {
                        const updatedItems = [...element.content.items];
                        updatedItems[index].description = e.target.value;
                        
                        onChange({
                          ...element,
                          content: {
                            ...element.content,
                            items: updatedItems,
                          },
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="mb-2">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const updatedItems = [...element.content.items];
                        updatedItems[index].price = Number(e.target.value);
                        
                        // Recalculate total
                        const total = updatedItems.reduce((sum, item) => sum + item.price, 0);
                        
                        onChange({
                          ...element,
                          content: {
                            ...element.content,
                            items: updatedItems,
                            total,
                          },
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const updatedItems = element.content.items.filter((_, i) => i !== index);
                      // Recalculate total
                      const total = updatedItems.reduce((sum, item) => sum + item.price, 0);
                      
                      onChange({
                        ...element,
                        content: {
                          ...element.content,
                          items: updatedItems,
                          total,
                        },
                      });
                    }}
                    className="w-full mt-2"
                  >
                    Remove Item
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const updatedItems = [
                    ...element.content.items,
                    { name: 'New Item', description: 'Description', price: 0 },
                  ];
                  
                  onChange({
                    ...element,
                    content: {
                      ...element.content,
                      items: updatedItems,
                    },
                  });
                }}
                className="w-full"
              >
                Add Item
              </Button>
            </div>
            <div>
              <Label>Total</Label>
              <Input
                type="number"
                value={element.content.total}
                onChange={(e) => {
                  onChange({
                    ...element,
                    content: {
                      ...element.content,
                      total: Number(e.target.value),
                    },
                  });
                }}
                className="mt-1"
              />
            </div>
          </div>
        );
      
      case 'scopeBlock':
        return (
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={element.content.title}
                onChange={(e) => {
                  onChange({
                    ...element,
                    content: {
                      ...element.content,
                      title: e.target.value,
                    },
                  });
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="mb-2 block">Items</Label>
              {element.content.items.map((item, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => {
                      const updatedItems = [...element.content.items];
                      updatedItems[index] = e.target.value;
                      
                      onChange({
                        ...element,
                        content: {
                          ...element.content,
                          items: updatedItems,
                        },
                      });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updatedItems = element.content.items.filter((_, i) => i !== index);
                      
                      onChange({
                        ...element,
                        content: {
                          ...element.content,
                          items: updatedItems,
                        },
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  onChange({
                    ...element,
                    content: {
                      ...element.content,
                      items: [...element.content.items, 'New item'],
                    },
                  });
                }}
                className="w-full mt-2"
              >
                Add Item
              </Button>
            </div>
          </div>
        );
      
      default:
        return <div>No properties available for this element type</div>;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Properties</h3>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div>
          <Label>Position</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={element.x}
                onChange={(e) => {
                  onChange({
                    ...element,
                    x: Number(e.target.value),
                  });
                }}
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={element.y}
                onChange={(e) => {
                  onChange({
                    ...element,
                    y: Number(e.target.value),
                  });
                }}
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label>Size</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={element.width}
                onChange={(e) => handleSizeChange('width', Number(e.target.value))}
                min={10}
                max={800}
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={element.height}
                onChange={(e) => handleSizeChange('height', Number(e.target.value))}
                min={10}
                max={1000}
              />
            </div>
          </div>
        </div>
        
        {element.type === 'text' || element.type === 'heading' ? (
          <div className="space-y-3">
            <div>
              <Label>Font Style</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Select
                  defaultValue={element.style?.fontFamily || 'sans-serif'}
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans-serif">Sans Serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="cursive">Cursive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  defaultValue={element.style?.fontWeight?.toString() || 'normal'}
                  onValueChange={(value) => handleStyleChange('fontWeight', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Font Size</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  defaultValue={[parseInt(element.style?.fontSize as string || '16')]}
                  max={72}
                  min={8}
                  step={1}
                  onValueChange={(value) => handleStyleChange('fontSize', `${value[0]}px`)}
                  className="flex-1"
                />
                <span className="min-w-[40px] text-right">
                  {element.style?.fontSize || '16px'}
                </span>
              </div>
            </div>
            
            <div>
              <Label>Text Color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={element.style?.color || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  className="w-10 h-10 p-1 border rounded"
                />
                <Input
                  value={element.style?.color || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        ) : null}
        
        <Separator />
        
        {renderContentEditor()}
      </div>
    </div>
  );
}