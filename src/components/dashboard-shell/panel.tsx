import { cn } from "@/lib/utils";

export function Panel({
  title,
  sub,
  action,
  className,
  children,
}: {
  title?: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface-subtle shadow-panel rounded-[26px] border border-border/70 bg-card/95 backdrop-blur-sm",
        className
      )}
    >
      {title ? (
        <div className="flex items-start justify-between gap-4 px-6 pt-5.5">
          <div>
            <div className="text-heading text-[15px] text-foreground">{title}</div>
            {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}
