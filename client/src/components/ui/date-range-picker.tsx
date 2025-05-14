import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  initialDateFrom?: Date;
  initialDateTo?: Date;
  onUpdate: (dateRange: { from: Date | undefined; to: Date | undefined }) => void;
}

export function DateRangePicker({
  initialDateFrom,
  initialDateTo,
  onUpdate
}: DateRangePickerProps) {
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: initialDateFrom,
    to: initialDateTo,
  });

  useEffect(() => {
    // If initialDateFrom or initialDateTo change, update the date state
    if (initialDateFrom || initialDateTo) {
      setDate({
        from: initialDateFrom || date.from,
        to: initialDateTo || date.to,
      });
    }
  }, [initialDateFrom, initialDateTo]);

  // When date changes, call the onUpdate callback
  useEffect(() => {
    onUpdate(date);
  }, [date, onUpdate]);

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}