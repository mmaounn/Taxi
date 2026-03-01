"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  /** Value in yyyy-MM-dd format (same as native date input) */
  value?: string;
  /** Called with yyyy-MM-dd string or "" when cleared */
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function DatePicker({
  value,
  onChange,
  placeholder = "TT.MM.JJJJ",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const displayValue = date ? format(date, "dd.MM.yyyy") : "";

  function handleSelect(selected: Date | undefined) {
    if (selected) {
      onChange?.(format(selected, "yyyy-MM-dd"));
    } else {
      onChange?.("");
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={de}
          defaultMonth={date}
          weekStartsOn={1}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
