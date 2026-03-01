"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getWeekBounds,
  getWeekBoundsForDate,
  getWeekOffset,
  formatWeekLabel,
} from "@/lib/date-utils";

interface WeekPickerProps {
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
  className?: string;
}

export function WeekPicker({ value, onChange, className }: WeekPickerProps) {
  const [open, setOpen] = useState(false);
  const currentOffset = getWeekOffset(value.start);

  function shift(delta: number) {
    onChange(getWeekBounds(currentOffset + delta));
  }

  function handleCalendarSelect(date: Date | undefined) {
    if (!date) return;
    onChange(getWeekBoundsForDate(date));
    setOpen(false);
  }

  const thisWeek = getWeekBounds(0);
  const isThisWeek = value.start === thisWeek.start && value.end === thisWeek.end;

  const rangeStart = new Date(value.start + "T00:00:00");
  const rangeEnd = new Date(value.end + "T00:00:00");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={isThisWeek ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(thisWeek)}
      >
        Diese Woche
      </Button>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[280px] justify-center gap-2 font-medium text-sm h-8">
              <CalendarIcon className="h-4 w-4" />
              {formatWeekLabel(value.start, value.end)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="range"
              selected={{ from: rangeStart, to: rangeEnd }}
              onDayClick={handleCalendarSelect}
              locale={de}
              defaultMonth={rangeStart}
              weekStartsOn={1}
              showWeekNumber
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
