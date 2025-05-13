import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextElementProps {
  content: string;
  style?: React.CSSProperties;
  isSelected: boolean;
  onChange: (content: string) => void;
}

export function TextElement({ content, style, isSelected, onChange }: TextElementProps) {
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

  // If not editing, render regular paragraph
  if (!isEditing) {
    return (
      <div 
        className={cn("w-full h-full p-2 overflow-hidden", isSelected ? "cursor-text" : "cursor-move")}
        onDoubleClick={handleDoubleClick}
        style={style}
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
      style={style}
      suppressContentEditableWarning
    >
      {editableContent}
    </div>
  );
}