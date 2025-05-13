import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HeadingElementProps {
  content: string;
  style?: React.CSSProperties;
  isSelected: boolean;
  onChange: (content: string) => void;
}

export function HeadingElement({ content, style, isSelected, onChange }: HeadingElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const editableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const handleDoubleClick = () => {
    if (isSelected) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editableContent);
  };

  const handleChange = () => {
    if (editableRef.current) {
      setEditableContent(editableRef.current.innerText);
    }
  };

  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      // Set cursor at the end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const defaultStyles = {
    fontFamily: 'sans-serif',
    fontSize: '32px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    ...style
  };

  // If not editing, render regular heading
  if (!isEditing) {
    return (
      <div 
        className={cn("w-full h-full p-2 overflow-hidden", isSelected ? "cursor-text" : "cursor-move")}
        onDoubleClick={handleDoubleClick}
        style={defaultStyles}
      >
        {content}
      </div>
    );
  }

  // If editing, render editable div
  return (
    <div
      ref={editableRef}
      className="w-full h-full p-2 overflow-auto focus:outline-none"
      contentEditable
      onBlur={handleBlur}
      onInput={handleChange}
      style={defaultStyles}
      suppressContentEditableWarning
    >
      {editableContent}
    </div>
  );
}