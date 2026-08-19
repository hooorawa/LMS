import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "shadow-hairline relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-xl border px-4 py-3 text-sm has-[>svg]:grid-cols-[theme(spacing.5)_1fr] has-[>svg]:gap-x-3 [&>svg]:mt-0.5 [&>svg]:size-5",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground [&>svg]:text-foreground",
        success: "border-success/20 bg-success/10 text-success [&>svg]:text-success",
        warning: "border-warning/25 bg-warning/15 text-warning [&>svg]:text-warning",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive [&>svg]:text-destructive",
        info: "border-primary/20 bg-primary/10 text-primary [&>svg]:text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-current/90 [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
