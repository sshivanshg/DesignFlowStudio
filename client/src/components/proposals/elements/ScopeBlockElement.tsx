import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface ScopeBlockElementProps {
  content: {
    title: string;
    items: string[];
  };
  style?: React.CSSProperties;
  isSelected: boolean;
  onChange: (content: any) => void;
}

export function ScopeBlockElement({ content, style, isSelected }: ScopeBlockElementProps) {
  const { title = "Project Scope", items = [] } = content || {};

  return (
    <div
      className={cn(
        "w-full h-full p-4 overflow-auto bg-white border rounded-md",
        isSelected ? "cursor-text" : "cursor-move"
      )}
      style={style}
    >
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
        
        {items.length === 0 && (
          <li className="text-gray-400 italic">No scope items added</li>
        )}
      </ul>
    </div>
  );
}