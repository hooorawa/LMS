"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxPrimitive.Root.Props<Value, Multiple>
) {
  return <ComboboxPrimitive.Root data-slot="combobox" {...props} />;
}

function ComboboxInputGroup({ className, ...props }: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn("relative flex items-center", className)}
      {...props}
    />
  );
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <>
      <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className={cn(
          "shadow-hairline h-11 w-full min-w-0 rounded-xl border border-input bg-background py-2 pr-9 pl-9 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          className
        )}
        {...props}
      />
      <ComboboxPrimitive.Trigger className="absolute right-3 flex items-center">
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </ComboboxPrimitive.Trigger>
    </>
  );
}

function ComboboxPortal(props: ComboboxPrimitive.Portal.Props) {
  return <ComboboxPrimitive.Portal data-slot="combobox-portal" {...props} />;
}

function ComboboxPositioner({
  className,
  sideOffset = 6,
  ...props
}: ComboboxPrimitive.Positioner.Props) {
  return (
    <ComboboxPrimitive.Positioner
      data-slot="combobox-positioner"
      sideOffset={sideOffset}
      className={cn("z-50 outline-none", className)}
      {...props}
    />
  );
}

function ComboboxContent({ className, children, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPortal>
      <ComboboxPositioner>
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "shadow-panel max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto rounded-xl border border-border bg-card p-1 text-card-foreground outline-none transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          <ComboboxPrimitive.Empty className="px-2.5 py-6 text-center text-sm text-muted-foreground empty:m-0 empty:p-0">
            No results found.
          </ComboboxPrimitive.Empty>
          <ComboboxPrimitive.List>{children}</ComboboxPrimitive.List>
        </ComboboxPrimitive.Popup>
      </ComboboxPositioner>
    </ComboboxPortal>
  );
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm text-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
        <Check className="size-4" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup(props: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" {...props} />;
}

function ComboboxGroupLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxContent,
  ComboboxItem,
  ComboboxGroup,
  ComboboxGroupLabel,
};
