import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Panel } from "./panel";
import { Badge } from "@/components/ui/badge";

type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  badge?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>["variant"];
  href?: string;
};

export function AttentionList({
  title = "Needs attention",
  sub,
  items,
  emptyLabel = "Everything looks clear right now.",
}: {
  title?: string;
  sub?: string;
  items: AttentionItem[];
  emptyLabel?: string;
}) {
  return (
    <Panel title={title} sub={sub} className="p-5">
      <div className="mt-4 flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => {
            const content = (
              <div className="flex min-w-0 items-start gap-3">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.badge ? (
                      <Badge variant={item.badgeVariant ?? "warning"}>{item.badge}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={item.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                {content}
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
