"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent bg-muted p-0.5 shadow-inner transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="size-5 rounded-full bg-white shadow-button transition-transform data-[checked]:translate-x-4"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
