import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ProposalElement } from '@/pages/proposal-editor';
import { 
  Trash2, 
  ChevronsUp, 
  ChevronsDown,
  Copy
} from 'lucide-react';
import { 
  TextElement, 
  HeadingElement,
  ImageElement,
  PricingTableElement,
  ScopeBlockElement
} from './elements';

interface EditorCanvasProps {
  elements: ProposalElement[];
  selectedElement: ProposalElement | null;
  onSelectElement: (element: ProposalElement | null) => void;
  onUpdateElement: (element: ProposalElement) => void;
  onDeleteElement: (id: string) => void;
}

export function EditorCanvas({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElement,
  onDeleteElement
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedElement, setDraggedElement] = useState<ProposalElement | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Handle mousedown on an element
  const handleMouseDown = (e: React.MouseEvent, element: ProposalElement) => {
    if (e.button !== 0) return; // Only left mouse button
    
    // Prevent default behavior to avoid text selection
    e.preventDefault();
    
    // Select the element
    onSelectElement(element);
    
    // Start drag
    setDraggedElement(element);
    setStartPos({
      x: e.clientX - element.x,
      y: e.clientY - element.y
    });
  };

  // Handle mousemove while dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedElement) return;
    
    // Calculate new position
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    
    // Update element position
    onUpdateElement({
      ...draggedElement,
      x: newX,
      y: newY
    });
  };

  // Handle mouseup to end dragging
  const handleMouseUp = () => {
    setDraggedElement(null);
  };

  // Function to render the correct element based on type
  const renderElement = (element: ProposalElement) => {
    const isSelected = selectedElement?.id === element.id;
    
    const baseProps = {
      style: {
        ...element.style,
        position: 'absolute' as const,
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        zIndex: element.zIndex,
      }
    };
    
    // Wrapper component with common functionality
    const ElementWrapper = ({ children }: { children: React.ReactNode }) => (
      <div
        className={cn(
          "bg-white border relative",
          isSelected ? "border-primary shadow-md" : "border-transparent hover:border-gray-300"
        )}
        style={baseProps.style}
        onMouseDown={(e) => handleMouseDown(e, element)}
      >
        {children}
        
        {isSelected && (
          <div className="absolute -right-10 top-0 flex flex-col bg-white border shadow-sm rounded-sm">
            <button 
              className="p-1 hover:bg-gray-100" 
              onClick={() => onDeleteElement(element.id)}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
            <button 
              className="p-1 hover:bg-gray-100" 
              onClick={() => {
                onUpdateElement({
                  ...element,
                  zIndex: element.zIndex + 1
                });
              }}
              title="Bring forward"
            >
              <ChevronsUp size={14} />
            </button>
            <button 
              className="p-1 hover:bg-gray-100" 
              onClick={() => {
                onUpdateElement({
                  ...element,
                  zIndex: Math.max(1, element.zIndex - 1)
                });
              }}
              title="Send backward"
            >
              <ChevronsDown size={14} />
            </button>
            <button 
              className="p-1 hover:bg-gray-100" 
              onClick={() => {
                const newElement = {
                  ...element,
                  id: Math.random().toString(36).substr(2, 9),
                  x: element.x + 20,
                  y: element.y + 20,
                  zIndex: Date.now()
                };
                onUpdateElement(newElement);
              }}
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
          </div>
        )}
      </div>
    );

    // Render the appropriate element based on type
    switch (element.type) {
      case 'text':
        return (
          <ElementWrapper key={element.id}>
            <TextElement
              content={element.content}
              isSelected={isSelected}
              onChange={(content) => {
                onUpdateElement({
                  ...element,
                  content
                });
              }}
            />
          </ElementWrapper>
        );
      case 'heading':
        return (
          <ElementWrapper key={element.id}>
            <HeadingElement
              content={element.content}
              isSelected={isSelected}
              onChange={(content) => {
                onUpdateElement({
                  ...element,
                  content
                });
              }}
            />
          </ElementWrapper>
        );
      case 'image':
        return (
          <ElementWrapper key={element.id}>
            <ImageElement
              content={element.content}
              isSelected={isSelected}
              onChange={(content) => {
                onUpdateElement({
                  ...element,
                  content
                });
              }}
            />
          </ElementWrapper>
        );
      case 'pricingTable':
        return (
          <ElementWrapper key={element.id}>
            <PricingTableElement
              content={element.content}
              isSelected={isSelected}
              onChange={(content) => {
                onUpdateElement({
                  ...element,
                  content
                });
              }}
            />
          </ElementWrapper>
        );
      case 'scopeBlock':
        return (
          <ElementWrapper key={element.id}>
            <ScopeBlockElement
              content={element.content}
              isSelected={isSelected}
              onChange={(content) => {
                onUpdateElement({
                  ...element,
                  content
                });
              }}
            />
          </ElementWrapper>
        );
      default:
        return null;
    }
  };

  // Handle background click to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectElement(null);
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full relative bg-white shadow-md overflow-auto"
      style={{ 
        width: '794px', // A4 width in pixels at 96 DPI
        height: '1123px', // A4 height in pixels at 96 DPI
        margin: '2rem auto' 
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {elements.map(renderElement)}
    </div>
  );
}