import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from './ColorPicker';

interface PropertiesPanelProps {
  element: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export function PropertiesPanel({ element, onUpdate, onDelete }: PropertiesPanelProps) {
  if (!element) return null;

  // Generate property fields based on element type
  const renderElementProperties = () => {
    switch (element.type) {
      case 'heading':
      case 'text':
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label>Content</Label>
                {element.type === 'heading' ? (
                  <Input 
                    value={element.content || ''} 
                    onChange={(e) => onUpdate({ content: e.target.value })} 
                  />
                ) : (
                  <Textarea
                    value={element.content || ''} 
                    onChange={(e) => onUpdate({ content: e.target.value })}
                    rows={5}
                  />
                )}
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="typography">
                  <AccordionTrigger>Typography</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Font Size</Label>
                        <div className="flex items-center space-x-2">
                          <Slider 
                            defaultValue={[parseFloat(element.style?.fontSize || '16')]}
                            min={8}
                            max={72}
                            step={1}
                            onValueChange={(values) => {
                              onUpdate({ 
                                style: { 
                                  ...element.style, 
                                  fontSize: `${values[0]}px` 
                                } 
                              });
                            }}
                          />
                          <span className="w-12 text-sm text-right">
                            {parseFloat(element.style?.fontSize || '16')}px
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Text Color</Label>
                        <ColorPicker 
                          color={element.style?.color || '#000000'} 
                          onChange={(color) => {
                            onUpdate({ style: { ...element.style, color } });
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label>Alignment</Label>
                        <div className="flex space-x-1 mt-1">
                          <Button
                            type="button"
                            size="icon"
                            variant={element.style?.textAlign === 'left' ? 'default' : 'outline'}
                            onClick={() => onUpdate({ style: { ...element.style, textAlign: 'left' } })}
                          >
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant={element.style?.textAlign === 'center' ? 'default' : 'outline'}
                            onClick={() => onUpdate({ style: { ...element.style, textAlign: 'center' } })}
                          >
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant={element.style?.textAlign === 'right' ? 'default' : 'outline'}
                            onClick={() => onUpdate({ style: { ...element.style, textAlign: 'right' } })}
                          >
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Font Style</Label>
                        <div className="flex space-x-1 mt-1">
                          <Button
                            type="button"
                            size="icon"
                            variant={element.style?.fontWeight === 'bold' ? 'default' : 'outline'}
                            onClick={() => {
                              const weight = element.style?.fontWeight === 'bold' ? 'normal' : 'bold';
                              onUpdate({ style: { ...element.style, fontWeight: weight } });
                            }}
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant={element.style?.fontStyle === 'italic' ? 'default' : 'outline'}
                            onClick={() => {
                              const style = element.style?.fontStyle === 'italic' ? 'normal' : 'italic';
                              onUpdate({ style: { ...element.style, fontStyle: style } });
                            }}
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant={element.style?.textDecoration === 'underline' ? 'default' : 'outline'}
                            onClick={() => {
                              const decoration = element.style?.textDecoration === 'underline' ? 'none' : 'underline';
                              onUpdate({ style: { ...element.style, textDecoration: decoration } });
                            }}
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </>
        );
        
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label>Image URL</Label>
              <Input 
                value={element.content?.src || ''} 
                onChange={(e) => onUpdate({ 
                  content: { 
                    ...element.content, 
                    src: e.target.value 
                  } 
                })} 
              />
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input 
                value={element.content?.alt || ''} 
                onChange={(e) => onUpdate({ 
                  content: { 
                    ...element.content, 
                    alt: e.target.value 
                  } 
                })} 
              />
            </div>
          </div>
        );
        
      case 'pricing-table':
        return (
          <div className="space-y-4">
            <div>
              <Label>Pricing Items</Label>
              {element.content?.items?.map((item: any, index: number) => (
                <div key={index} className="mt-2 p-2 border rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const newItems = [...element.content.items];
                        newItems.splice(index, 1);
                        onUpdate({ 
                          content: { 
                            ...element.content, 
                            items: newItems 
                          } 
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input 
                        size="sm"
                        className="h-8 text-sm"
                        value={item.name || ''} 
                        onChange={(e) => {
                          const newItems = [...element.content.items];
                          newItems[index] = { ...newItems[index], name: e.target.value };
                          onUpdate({ 
                            content: { 
                              ...element.content, 
                              items: newItems 
                            } 
                          });
                        }} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Input 
                        size="sm"
                        className="h-8 text-sm"
                        value={item.description || ''} 
                        onChange={(e) => {
                          const newItems = [...element.content.items];
                          newItems[index] = { ...newItems[index], description: e.target.value };
                          onUpdate({ 
                            content: { 
                              ...element.content, 
                              items: newItems 
                            } 
                          });
                        }} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price</Label>
                      <Input 
                        size="sm"
                        className="h-8 text-sm"
                        type="number"
                        value={item.price || 0} 
                        onChange={(e) => {
                          const newItems = [...element.content.items];
                          newItems[index] = { 
                            ...newItems[index], 
                            price: parseFloat(e.target.value) || 0 
                          };
                          
                          // Update total
                          const total = newItems.reduce(
                            (sum, item) => sum + (parseFloat(item.price) || 0), 
                            0
                          );
                          
                          onUpdate({ 
                            content: { 
                              ...element.content, 
                              items: newItems,
                              total: total
                            } 
                          });
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                className="mt-2 w-full"
                variant="outline"
                onClick={() => {
                  const newItems = [...(element.content?.items || [])];
                  newItems.push({ name: 'New Item', description: 'Description', price: 0 });
                  
                  // Update total
                  const total = newItems.reduce(
                    (sum, item) => sum + (parseFloat(item.price) || 0), 
                    0
                  );
                  
                  onUpdate({ 
                    content: { 
                      ...element.content, 
                      items: newItems,
                      total: total
                    } 
                  });
                }}
              >
                Add Item
              </Button>
            </div>
            
            <div>
              <Label>Total: ${element.content?.total || 0}</Label>
            </div>
          </div>
        );
        
      case 'scope-block':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input 
                value={element.content?.title || ''} 
                onChange={(e) => onUpdate({ 
                  content: { 
                    ...element.content, 
                    title: e.target.value 
                  } 
                })} 
              />
            </div>
            
            <div>
              <Label>Scope Items</Label>
              {element.content?.items?.map((item: string, index: number) => (
                <div key={index} className="mt-2 flex space-x-2">
                  <Input 
                    value={item} 
                    onChange={(e) => {
                      const newItems = [...element.content.items];
                      newItems[index] = e.target.value;
                      onUpdate({ 
                        content: { 
                          ...element.content, 
                          items: newItems 
                        } 
                      });
                    }} 
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const newItems = [...element.content.items];
                      newItems.splice(index, 1);
                      onUpdate({ 
                        content: { 
                          ...element.content, 
                          items: newItems 
                        } 
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                className="mt-2 w-full"
                variant="outline"
                onClick={() => {
                  const newItems = [...(element.content?.items || [])];
                  newItems.push('New scope item');
                  onUpdate({ 
                    content: { 
                      ...element.content, 
                      items: newItems 
                    } 
                  });
                }}
              >
                Add Item
              </Button>
            </div>
          </div>
        );
        
      default:
        return <p>No properties available for this element type.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium capitalize">
          {element.type.replace('-', ' ')} Properties
        </h3>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div>
          <Label>Position</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">X</Label>
              <Input 
                type="number" 
                value={element.position?.x || 0} 
                onChange={(e) => {
                  onUpdate({ 
                    position: { 
                      ...element.position, 
                      x: parseInt(e.target.value) || 0 
                    } 
                  });
                }} 
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input 
                type="number" 
                value={element.position?.y || 0} 
                onChange={(e) => {
                  onUpdate({ 
                    position: { 
                      ...element.position, 
                      y: parseInt(e.target.value) || 0 
                    } 
                  });
                }} 
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label>Size</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Width</Label>
              <Input 
                type="number" 
                value={element.size?.width || 100} 
                onChange={(e) => {
                  onUpdate({ 
                    size: { 
                      ...element.size, 
                      width: parseInt(e.target.value) || 100 
                    } 
                  });
                }} 
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input 
                type="number" 
                value={element.size?.height || 100} 
                onChange={(e) => {
                  onUpdate({ 
                    size: { 
                      ...element.size, 
                      height: parseInt(e.target.value) || 100 
                    } 
                  });
                }} 
              />
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {renderElementProperties()}
    </div>
  );
}