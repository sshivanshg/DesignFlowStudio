import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LEAD_STAGES } from '@/contexts/CRMContext';

interface LeadStageLabelProps {
  stage: string;
}

export function LeadStageLabel({ stage }: LeadStageLabelProps) {
  // Define colors for each stage
  const getStageColor = (stageKey: string) => {
    switch (stageKey) {
      case LEAD_STAGES.NEW:
        return 'bg-blue-100 hover:bg-blue-100 text-blue-700 border-blue-200';
      case LEAD_STAGES.IN_DISCUSSION:
        return 'bg-amber-100 hover:bg-amber-100 text-amber-700 border-amber-200';
      case LEAD_STAGES.WON:
        return 'bg-green-100 hover:bg-green-100 text-green-700 border-green-200';
      case LEAD_STAGES.LOST:
        return 'bg-red-100 hover:bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 hover:bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get the stage name from the key
  const getStageName = (stageKey: string) => {
    switch (stageKey) {
      case LEAD_STAGES.NEW:
        return 'New';
      case LEAD_STAGES.IN_DISCUSSION:
        return 'In Discussion';
      case LEAD_STAGES.WON:
        return 'Won';
      case LEAD_STAGES.LOST:
        return 'Lost';
      default:
        return stageKey;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`font-medium ${getStageColor(stage)}`}
    >
      {getStageName(stage)}
    </Badge>
  );
}