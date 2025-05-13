import React from 'react';
import { useDrop } from 'react-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeadCard } from './LeadCard';
import type { LeadType } from '@hooks/useLeads';

interface LeadColumnProps {
  title: string;
  stage: string;
  leads: LeadType[];
  onDrop: (itemId: number, stage: string) => void;
  onEditLead: (lead: LeadType) => void;
  onDeleteLead: (id: number) => void;
}

interface CardCountColorMap {
  [key: string]: string;
}

export function LeadColumn({ 
  title, 
  stage, 
  leads, 
  onDrop, 
  onEditLead, 
  onDeleteLead 
}: LeadColumnProps) {
  // Set up drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'lead',
    drop: (item: { id: number }) => {
      onDrop(item.id, stage);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Get appropriate background color based on drop state
  const getBgColor = () => {
    if (isOver && canDrop) {
      return 'bg-green-50';
    }
    if (canDrop) {
      return 'bg-gray-50';
    }
    return 'bg-white';
  };

  // Map stages to count badge colors
  const countColors: CardCountColorMap = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    visited: 'bg-purple-100 text-purple-800',
    quoted: 'bg-indigo-100 text-indigo-800',
    closed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="h-full flex flex-col">
      <Card 
        ref={drop} 
        className={`w-full h-full flex flex-col transition-colors duration-150 ${getBgColor()}`}
      >
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <Badge className={`${countColors[stage]} font-normal`}>
              {leads.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-grow overflow-y-auto">
          <div className="grid gap-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={onEditLead}
                onDelete={onDeleteLead}
              />
            ))}
            {leads.length === 0 && (
              <div className="flex items-center justify-center h-16 border border-dashed rounded-md text-sm text-muted-foreground">
                No leads yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}