"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getWeekBounds,
  getWeekOffset,
  formatWeekLabel,
} from "@/lib/date-utils";

interface WeekPickerProps {
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
  className?: string;
}

export function WeekPicker({ value, onChange, className }: WeekPickerProps) {
  const currentOffset = getWeekOffset(value.start);

  function shift(delta: number) {
    onChange(getWeekBounds(currentOffset + delta));
  }

  const thisWeek = getWeekBounds(0);
  const lastWeek = getWeekBounds(-1);
  const isThisWeek = value.start === thisWeek.start && value.end === thisWeek.end;
  const isLastWeek = value.start === lastWeek.start && value.end === lastWeek.end;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        variant={isThisWeek ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(thisWeek)}
      >
        Diese Woche
      </Button>
      <Button
        variant={isLastWeek ? "default" : "outline"}
        size="sm"
        onClick={() => onChange(lastWeek)}
      >
        Letzte Woche
      </Button>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[260px] text-center text-sm font-medium">
          {formatWeekLabel(value.start, value.end)}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
