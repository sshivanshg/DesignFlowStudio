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
  
  const [isError, setIsError] = React.useState(false);

  const handleImageError = () => {
    setIsError(true);
  };

  return (
    <div 
      className={cn(
        "w-full h-full flex items-center justify-center overflow-hidden",
        isSelected ? "cursor-move" : "cursor-pointer"
      )}
      style={style}
    >
      {isError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
          <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 text-center">
            Image failed to load
          </p>
          <p className="text-xs text-gray-400 mt-1 text-center break-all">
            {src}
          </p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onError={handleImageError}
        />
      )}
    </div>
  );
}