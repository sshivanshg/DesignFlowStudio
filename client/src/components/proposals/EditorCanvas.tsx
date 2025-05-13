import React, { useState, useRef, useEffect } from 'react';
import { 
  ProposalElement, 
  TextElement as TextElementType,
  HeadingElement as HeadingElementType,
  ImageElement as ImageElementType,
  PricingTableElement as PricingTableElementType,
  ScopeBlockElement as ScopeBlockElementType,
} from '@/pages/proposal-editor';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';
import { ELEMENT_TYPES } from '@/components/proposals/ElementsPanel';
import { nanoid } from 'nanoid';
import { toast } from '@/hooks/use-toast';

// Import element components
import {
  TextElement,
  HeadingElement,
  ImageElement,
  PricingTableElement,
  ScopeBlockElement
} from './elements';

interface EditorCanvasProps {
  elements: ProposalElement[];
  onAddElement: (element: ProposalElement) => void;
  onUpdateElement: (element: ProposalElement) => void;
  onSelectElement: (id: string | null) => void;
  selectedElementId: string | null;
}

export function EditorCanvas({ 
  elements, 
  onAddElement, 
  onUpdateElement, 
  onSelectElement, 
  selectedElementId 
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ELEMENT_TYPES,
    drop: (item: { type: string }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = offset.x - canvasRect.left;
        const y = offset.y - canvasRect.top;
        handleDrop(item.type, x, y);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Handle dropping a new element
  const handleDrop = (type: string, x: number, y: number) => {
    if (ELEMENT_TYPES.includes(type)) {
      const newElement = createDefaultElement(type as ElementType, x, y);
      onAddElement(newElement);
      onSelectElement(newElement.id);
      toast({
        title: "Element added",
        description: `Added new ${type} element to the proposal`,
      });
    }
  };

  // Handle element selection
  const handleElementClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSelectElement(id);
  };

  // Handle canvas background click to deselect
  const handleCanvasClick = () => {
    onSelectElement(null);
  };

  // Handle element dragging
  const handleDragStart = (e: React.DragEvent, id: string) => {
    // Only allow dragging if the element itself is clicked (not its content when editing)
    if ((e.target as HTMLElement).dataset.handle === 'true') {
      e.dataTransfer.setData('elementId', id);
      setIsDraggingElement(true);
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop2 = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('elementId');
    if (id && canvasRef.current) {
      const element = elements.find(el => el.id === id);
      if (element) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        
        onUpdateElement({
          ...element,
          x,
          y,
        });
      }
    }
    setIsDraggingElement(false);
  };

  const handleDragEnd = () => {
    setIsDraggingElement(false);
  };

  // Render element based on its type
  const renderElement = (element: ProposalElement) => {
    const isSelected = element.id === selectedElementId;
    
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      zIndex: element.zIndex,
      border: isSelected ? '2px solid #3b82f6' : 'none',
      borderRadius: '4px',
      ...element.style,
    };
    
    // Common props for all elements
    const elementProps = {
      style: element.style,
      isSelected,
      onChange: (content: any) => handleContentChange(element.id, content),
    };
    
    // Element wrapper with common event handlers
    const ElementWrapper = ({ children }: { children: React.ReactNode }) => (
      <div
        data-handle="true"
        style={elementStyle}
        onClick={(e) => handleElementClick(e, element.id)}
        draggable={isSelected}
        onDragStart={(e) => handleDragStart(e, element.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          'overflow-hidden',
          isSelected ? 'element-selected' : '',
          isDraggingElement && isSelected ? 'opacity-50' : ''
        )}
      >
        {children}
      </div>
    );
    
    switch (element.type) {
      case 'text':
        return (
          <ElementWrapper key={element.id}>
            <TextElement 
              content={element.content} 
              {...elementProps}
            />
          </ElementWrapper>
        );
      
      case 'heading':
        return (
          <ElementWrapper key={element.id}>
            <HeadingElement 
              content={element.content} 
              {...elementProps}
            />
          </ElementWrapper>
        );
      
      case 'image':
        return (
          <ElementWrapper key={element.id}>
            <ImageElement 
              content={element.content} 
              {...elementProps}
            />
          </ElementWrapper>
        );
      
      case 'pricingTable':
        return (
          <ElementWrapper key={element.id}>
            <PricingTableElement 
              content={element.content} 
              {...elementProps}
            />
          </ElementWrapper>
        );
      
      case 'scopeBlock':
        return (
          <ElementWrapper key={element.id}>
            <ScopeBlockElement 
              content={element.content} 
              {...elementProps}
            />
          </ElementWrapper>
        );
      
      default:
        return null;
    }
  };

  // Handle content updates for elements
  const handleContentChange = (id: string, content: any) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      onUpdateElement({
        ...element,
        content,
      });
    }
  };

  // Create a default element based on type
  const createDefaultElement = (type: string, x: number, y: number): ProposalElement => {
    const baseProperties = {
      id: nanoid(),
      x,
      y,
      zIndex: elements.length + 1,
    };
    
    switch (type) {
      case 'text':
        return {
          ...baseProperties,
          type: 'text',
          width: 300,
          height: 100,
          content: 'Double-click to edit this text.',
          style: {
            fontSize: '16px',
            fontFamily: 'sans-serif',
          },
        } as TextElementType;
      
      case 'heading':
        return {
          ...baseProperties,
          type: 'heading',
          width: 500,
          height: 80,
          content: 'Proposal Heading',
          style: {
            fontSize: '32px',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
          },
        } as HeadingElementType;
      
      case 'image':
        return {
          ...baseProperties,
          type: 'image',
          width: 300,
          height: 200,
          content: {
            src: 'https://placehold.co/600x400/e5e7eb/a3a3a3?text=Insert+Image',
            alt: 'Placeholder image',
          },
        } as ImageElementType;
      
      case 'pricingTable':
        return {
          ...baseProperties,
          type: 'pricingTable',
          width: 500,
          height: 300,
          content: {
            items: [
              { name: 'Item 1', description: 'Description of item 1', price: 100 },
              { name: 'Item 2', description: 'Description of item 2', price: 150 },
            ],
            total: 250,
          },
        } as PricingTableElementType;
      
      case 'scopeBlock':
        return {
          ...baseProperties,
          type: 'scopeBlock',
          width: 400,
          height: 250,
          content: {
            title: 'Project Scope',
            items: [
              'Initial consultation and requirements gathering',
              'Design concepts and revisions',
              'Final implementation',
            ],
          },
        } as ScopeBlockElementType;
      
      default:
        return {
          ...baseProperties,
          type: 'text',
          width: 300,
          height: 100,
          content: 'Text element',
        } as TextElementType;
    }
  };

  return (
    <div
      ref={(el) => {
        drop(el);
        canvasRef.current = el as HTMLDivElement;
      }}
      className={cn(
        'relative w-full h-full overflow-auto bg-white border border-gray-200 shadow-sm',
        isOver ? 'bg-gray-50' : ''
      )}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop2}
    >
      <div className="relative min-h-[1200px] w-full">
        {/* Canvas guidelines (optional) */}
        <div className="absolute w-full h-full pointer-events-none">
          <div className="grid grid-cols-12 h-full opacity-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-r border-gray-400 h-full" />
            ))}
          </div>
        </div>
        
        {/* Render elements */}
        {elements.map(renderElement)}
      </div>
    </div>
  );
}