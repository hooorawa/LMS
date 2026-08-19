"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function Calendar({
  className,
  selected,
  onSelect,
  month: monthProp,
  onMonthChange,
  disabled,
}: {
  className?: string;
  selected?: Date | null;
  onSelect?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}) {
  const [internalMonth, setInternalMonth] = React.useState(selected ?? new Date());
  const month = monthProp ?? internalMonth;

  const setMonth = (date: Date) => {
    onMonthChange?.(date);
    if (!monthProp) setInternalMonth(date);
  };

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div data-slot="calendar" className={cn("w-72 select-none", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth(subMonths(month, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground">{format(month, "MMMM yyyy")}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1.5">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isOutside = !isSameMonth(day, month);
          const isDisabled = disabled?.(day) ?? false;
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(day)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg text-sm text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40",
                isOutside && "text-muted-foreground/60",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
