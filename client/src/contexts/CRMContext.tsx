import React, { createContext, useContext, useState, ReactNode } from 'react';

// Lead stage definitions
export const LEAD_STAGES = {
  NEW: "new",
  IN_DISCUSSION: "in_discussion",
  WON: "won",
  LOST: "lost"
};

// Valid lead tags
export const LEAD_TAGS = [
  "residential",
  "commercial",
  "renovation",
  "new-build",
  "consultation",
  "high-priority"
];

// Lead source options
export const LEAD_SOURCES = [
  "website",
  "referral",
  "social-media",
  "advertisement",
  "cold-call",
  "event",
  "other"
];

type CRMContextType = {
  activeFilters: {
    search: string;
    tags: string[];
    sources: string[];
    dateFrom: Date | null;
    dateTo: Date | null;
    assignedToMe: boolean;
  };
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  isFiltered: boolean;
};

// Default filter state
const defaultFilters = {
  search: '',
  tags: [],
  sources: [],
  dateFrom: null,
  dateTo: null,
  assignedToMe: false
};

export const CRMContext = createContext<CRMContextType>({
  activeFilters: defaultFilters,
  setFilter: () => {},
  resetFilters: () => {},
  isFiltered: false
});

export const CRMProvider = ({ children }: { children: ReactNode }) => {
  const [activeFilters, setActiveFilters] = useState(defaultFilters);

  // Helper to determine if any filter is active
  const isFiltered = 
    activeFilters.search !== '' || 
    activeFilters.tags.length > 0 || 
    activeFilters.sources.length > 0 || 
    activeFilters.dateFrom !== null || 
    activeFilters.dateTo !== null ||
    activeFilters.assignedToMe;
  
  // Update a specific filter
  const setFilter = (key: string, value: any) => {
    setActiveFilters(prev => ({ 
      ...prev, 
      [key]: value 
    }));
  };
  
  // Reset all filters to default values
  const resetFilters = () => {
    setActiveFilters(defaultFilters);
  };

  return (
    <CRMContext.Provider value={{ 
      activeFilters, 
      setFilter, 
      resetFilters, 
      isFiltered 
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => useContext(CRMContext);