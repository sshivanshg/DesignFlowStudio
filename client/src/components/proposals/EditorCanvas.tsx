import React, { useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Trash2, Move, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Element components
import { TextElement } from './elements/TextElement';
import { HeadingElement } from './elements/HeadingElement';
import { ImageElement } from './elements/ImageElement';
import { PricingTableElement } from './elements/PricingTableElement';
import { ScopeBlockElement } from './elements/ScopeBlockElement';

interface EditorCanvasProps {
  sections: any[];
  selectedElement: any;
  onElementSelect: (element: any) => void;
  onElementUpdate: (elementId: string, updates: any) => void;
  onElementDelete: (elementId: string) => void;
}

export function EditorCanvas({ 
  sections, 
  selectedElement, 
  onElementSelect,
  onElementUpdate,
  onElementDelete
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleElementMove = (elementId: string, position: { x: number, y: number }) => {
    onElementUpdate(elementId, { position });
  };

  const renderElement = (element: any) => {
    const isSelected = selectedElement && selectedElement.id === element.id;
    
    switch (element.type) {
      case 'heading':
        return (
          <DraggableElement 
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => onElementSelect(element)}
            onMove={handleElementMove}
            onDelete={onElementDelete}
          >
            <HeadingElement 
              content={element.content} 
              style={element.style} 
              isSelected={isSelected}
              onChange={(content) => onElementUpdate(element.id, { content })}
            />
          </DraggableElement>
        );
      case 'text':
        return (
          <DraggableElement 
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => onElementSelect(element)}
            onMove={handleElementMove}
            onDelete={onElementDelete}
          >
            <TextElement 
              content={element.content} 
              style={element.style} 
              isSelected={isSelected}
              onChange={(content) => onElementUpdate(element.id, { content })}
            />
          </DraggableElement>
        );
      case 'image':
        return (
          <DraggableElement 
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => onElementSelect(element)}
            onMove={handleElementMove}
            onDelete={onElementDelete}
          >
            <ImageElement 
              content={element.content} 
              style={element.style} 
              isSelected={isSelected}
              onChange={(content) => onElementUpdate(element.id, { content })}
            />
          </DraggableElement>
        );
      case 'pricing-table':
        return (
          <DraggableElement 
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => onElementSelect(element)}
            onMove={handleElementMove}
            onDelete={onElementDelete}
          >
            <PricingTableElement 
              content={element.content} 
              style={element.style} 
              isSelected={isSelected}
              onChange={(content) => onElementUpdate(element.id, { content })}
            />
          </DraggableElement>
        );
      case 'scope-block':
        return (
          <DraggableElement 
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => onElementSelect(element)}
            onMove={handleElementMove}
            onDelete={onElementDelete}
          >
            <ScopeBlockElement 
              content={element.content} 
              style={element.style} 
              isSelected={isSelected}
              onChange={(content) => onElementUpdate(element.id, { content })}
            />
          </DraggableElement>
        );
      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative mx-auto" style={{ width: '816px' }}>
        {sections.map((section) => (
          <div 
            key={section.id} 
            className="bg-white shadow-sm rounded-lg p-8 mb-8 min-h-[1056px] relative"
            ref={canvasRef}
            style={{ width: '816px', height: 'auto' }}
          >
            {section.elements.map(renderElement)}
            
            {/* Empty state */}
            {section.elements.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="mb-2">Drag elements here to start designing your proposal</p>
                <p className="text-sm">or</p>
                <p className="mt-2">Select a template from the left panel</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </DndProvider>
  );
}

// Draggable Element Wrapper
interface DraggableElementProps {
  element: any;
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (elementId: string, position: { x: number, y: number }) => void;
  onDelete: (elementId: string) => void;
}

function DraggableElement({ 
  element, 
  children, 
  isSelected, 
  onSelect, 
  onMove,
  onDelete
}: DraggableElementProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'ELEMENT',
    item: { id: element.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const { clientX, clientY } = e;
    const containerRect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
    
    if (containerRect) {
      const newX = clientX - containerRect.left;
      const newY = clientY - containerRect.top;
      
      onMove(element.id, { 
        x: Math.max(0, newX), 
        y: Math.max(0, newY) 
      });
    }
  };

  return (
    <div
      ref={dragPreview}
      className={cn(
        "absolute cursor-move",
        isSelected ? "outline outline-2 outline-blue-500" : "",
        isDragging ? "opacity-50" : ""
      )}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
      }}
      onClick={handleMouseDown}
      draggable
      onDragEnd={handleDragEnd}
    >
      {children}
      
      {isSelected && (
        <div className="absolute top-0 right-0 -mt-9 flex items-center space-x-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <div
            ref={drag}
            className="cursor-move h-7 w-7 flex items-center justify-center rounded-md border bg-white"
          >
            <Move className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  );
}