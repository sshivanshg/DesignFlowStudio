import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

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
  const { title, items } = content;
  
  return (
    <div 
      className={cn(
        "w-full h-full p-4 overflow-auto",
        isSelected ? "cursor-move" : "cursor-pointer"
      )}
      style={style}
    >
      <div className="border rounded-md p-4 h-full">
        <h3 className="text-lg font-medium mb-3">{title}</h3>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 mt-0.5">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="ml-2 text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}