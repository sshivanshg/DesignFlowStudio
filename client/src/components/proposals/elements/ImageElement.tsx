import React from 'react';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

interface ImageElementProps {
  content: {
    src: string;
    alt: string;
  };
  style?: React.CSSProperties;
  isSelected: boolean;
  onChange: (content: { src: string; alt: string }) => void;
}

export function ImageElement({ content, style, isSelected }: ImageElementProps) {
  const { src, alt } = content;

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center overflow-hidden",
        isSelected ? "cursor-text" : "cursor-move"
      )}
      style={style}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Image'}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            // Show placeholder on error
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const placeholder = document.createElement('div');
              placeholder.className = 'flex flex-col items-center justify-center w-full h-full bg-gray-100 text-gray-400';
              
              const icon = document.createElement('div');
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"></path><line x1="13.5" y1="13.5" x2="6" y2="21"></line><path d="M13.5 13.5 21 6"></path><path d="M15 6h6v6"></path><path d="M3 3v.01"></path></svg>';
              
              const text = document.createElement('p');
              text.textContent = 'Image not found';
              text.className = 'mt-2 text-sm';
              
              placeholder.appendChild(icon);
              placeholder.appendChild(text);
              parent.appendChild(placeholder);
            }
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 text-gray-400">
          <ImageOff className="h-10 w-10 mb-2" />
          <p className="text-sm">No image source</p>
        </div>
      )}
    </div>
  );
}