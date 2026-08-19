import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary-subtle text-primary",
        secondary: "bg-secondary-subtle text-secondary-foreground",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        destructive: "bg-destructive-subtle text-destructive",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
