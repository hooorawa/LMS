"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  dateFormat = "PPP",
}: {
  value?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  dateFormat?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-11 w-full justify-start gap-2.5 px-3.5 font-normal",
              !value && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        {value ? format(value, dateFormat) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <Calendar
          selected={value}
          disabled={disabled}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
