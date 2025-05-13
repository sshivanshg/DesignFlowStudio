import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color || '#000000');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update input value when color prop changes
  useEffect(() => {
    setInputValue(color || '#000000');
  }, [color]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    // Validate color format
    if (/^#[0-9A-F]{6}$/i.test(inputValue)) {
      onChange(inputValue);
    } else {
      setInputValue(color || '#000000');
    }
  };

  // Common colors
  const colorPresets = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#808080', // Gray
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full flex items-center justify-between">
          <span>Select Color</span>
          <div 
            className="h-4 w-4 rounded border"
            style={{ backgroundColor: color || '#000000' }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="grid grid-cols-6 gap-2">
            {colorPresets.map((preset) => (
              <div
                key={preset}
                className="h-6 w-6 rounded-md cursor-pointer border"
                style={{ backgroundColor: preset }}
                onClick={() => {
                  setInputValue(preset);
                  onChange(preset);
                }}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-2">
            <span className="text-sm">Hex:</span>
            <Input
              ref={inputRef}
              className="col-span-3"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              type="text"
              placeholder="#000000"
            />
          </div>
          
          <input
            type="color"
            className="w-full h-8"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}