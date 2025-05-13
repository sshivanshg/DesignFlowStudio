import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  Search, 
  FilterX,
  CalendarIcon,
  SquareUser
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LEAD_TAGS, LEAD_SOURCES, useCRM } from '@/contexts/CRMContext';
import { cn } from '@/lib/utils';

export function LeadFilters() {
  const { 
    activeFilters, 
    setFilter, 
    resetFilters, 
    isFiltered 
  } = useCRM();
  
  const form = useForm({
    defaultValues: {
      search: activeFilters.search,
    }
  });
  
  // Handle search input
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = form.getValues();
    setFilter('search', data.search);
  };
  
  // Handle tag selection
  const handleTagSelect = (tag: string) => {
    const currentTags = [...activeFilters.tags];
    if (currentTags.includes(tag)) {
      setFilter('tags', currentTags.filter(t => t !== tag));
    } else {
      setFilter('tags', [...currentTags, tag]);
    }
  };
  
  // Handle source selection
  const handleSourceSelect = (source: string) => {
    const currentSources = [...activeFilters.sources];
    if (currentSources.includes(source)) {
      setFilter('sources', currentSources.filter(s => s !== source));
    } else {
      setFilter('sources', [...currentSources, source]);
    }
  };
  
  return (
    <div className="mb-6 space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search box */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-8"
              {...form.register("search")}
            />
          </div>
        </form>
        
        {/* Tag filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              Tags
              {activeFilters.tags.length > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground" variant="default">
                  {activeFilters.tags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filter by Tags</h4>
              <div className="space-y-1">
                {LEAD_TAGS.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tag-${tag}`} 
                      checked={activeFilters.tags.includes(tag)}
                      onCheckedChange={() => handleTagSelect(tag)}
                    />
                    <label 
                      htmlFor={`tag-${tag}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {tag.replace('-', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Source filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              Sources
              {activeFilters.sources.length > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground" variant="default">
                  {activeFilters.sources.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filter by Sources</h4>
              <div className="space-y-1">
                {LEAD_SOURCES.map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`source-${source}`} 
                      checked={activeFilters.sources.includes(source)}
                      onCheckedChange={() => handleSourceSelect(source)}
                    />
                    <label 
                      htmlFor={`source-${source}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {source.replace('-', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Date range filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "h-10",
                (activeFilters.dateFrom || activeFilters.dateTo) && 
                "text-primary border-primary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {activeFilters.dateFrom && activeFilters.dateTo ? (
                <>
                  {format(activeFilters.dateFrom, "LLL dd")} - {format(activeFilters.dateTo, "LLL dd")}
                </>
              ) : activeFilters.dateFrom ? (
                <>From {format(activeFilters.dateFrom, "LLL dd")}</>
              ) : activeFilters.dateTo ? (
                <>Until {format(activeFilters.dateTo, "LLL dd")}</>
              ) : (
                <>Date Range</>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={{
                from: activeFilters.dateFrom || undefined,
                to: activeFilters.dateTo || undefined,
              }}
              onSelect={(range) => {
                setFilter('dateFrom', range?.from || null);
                setFilter('dateTo', range?.to || null);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        
        {/* Assigned to me filter */}
        <Button 
          variant={activeFilters.assignedToMe ? "default" : "outline"} 
          size="sm"
          className="h-10"
          onClick={() => setFilter('assignedToMe', !activeFilters.assignedToMe)}
        >
          <SquareUser className="mr-2 h-4 w-4" />
          Assigned to me
        </Button>
        
        {/* Reset filters */}
        {isFiltered && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={resetFilters}
            className="h-10"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
      
      {/* Active filter badges */}
      {isFiltered && (
        <div className="flex flex-wrap gap-2 pt-2">
          {activeFilters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: {activeFilters.search}
              <button 
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => setFilter('search', '')}
              >
                ×
              </button>
            </Badge>
          )}
          
          {activeFilters.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              Tag: {tag.replace('-', ' ')}
              <button 
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => handleTagSelect(tag)}
              >
                ×
              </button>
            </Badge>
          ))}
          
          {activeFilters.sources.map(source => (
            <Badge key={source} variant="secondary" className="text-xs">
              Source: {source.replace('-', ' ')}
              <button 
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => handleSourceSelect(source)}
              >
                ×
              </button>
            </Badge>
          ))}
          
          {(activeFilters.dateFrom || activeFilters.dateTo) && (
            <Badge variant="secondary" className="text-xs">
              Date: {activeFilters.dateFrom ? format(activeFilters.dateFrom, "MMM dd") : 'Any'} 
              {' '}-{' '}
              {activeFilters.dateTo ? format(activeFilters.dateTo, "MMM dd") : 'Any'}
              <button 
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFilter('dateFrom', null);
                  setFilter('dateTo', null);
                }}
              >
                ×
              </button>
            </Badge>
          )}
          
          {activeFilters.assignedToMe && (
            <Badge variant="secondary" className="text-xs">
              Assigned to me
              <button 
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => setFilter('assignedToMe', false)}
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}