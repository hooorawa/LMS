"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NAV_BY_ROLE, type NavKey } from "./nav-config";

export function NavSearch({ navKey }: { navKey: NavKey }) {
  const router = useRouter();
  const items = NAV_BY_ROLE[navKey].filter((item) => !item.disabled);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group?.toLowerCase().includes(q)
    );
  }, [items, query]);
  const activeIndex = Math.min(highlighted, Math.max(results.length - 1, 0));

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function goTo(href: string) {
    router.push(href);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setQuery("");
        setHighlighted(0);
        if (next) requestAnimationFrame(() => inputRef.current?.focus());
      }}
    >
      <PopoverTrigger className="shadow-hairline hidden w-[210px] items-center gap-2 rounded-lg bg-card px-3.5 py-2 sm:flex">
        <Search className="size-[15px] text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground">Search</span>
        <kbd className="ml-auto rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          /
        </kbd>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-2">
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlighted(0);
          }}
          placeholder="Jump to a page…"
          className="h-9 text-sm"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlighted((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlighted((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              const item = results[activeIndex];
              if (item) goTo(item.href);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />

        <div className="mt-2 flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-2 py-3 text-center text-[12.5px] text-muted-foreground">No matches.</p>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => goTo(item.href)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-foreground",
                    index === activeIndex ? "bg-muted" : "hover:bg-muted/60"
                  )}
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  {item.label}
                  {item.group ? (
                    <span className="ml-auto text-[10.5px] font-normal text-muted-foreground/70">
                      {item.group}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
