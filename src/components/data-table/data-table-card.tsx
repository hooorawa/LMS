"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Inbox, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn = {
  key: string;
  header: string;
  headerClassName?: string;
  /** Enables click-to-sort on this column; requires rows to provide a matching `sortValues` entry. */
  sortable?: boolean;
};

export type DataTableRow = {
  key: string;
  /** Plain-text value to match against the search query; omit for non-searchable tables. */
  searchValue?: string;
  /** Comparable values parallel to `cells`, used only for sortable columns. */
  sortValues?: (string | number | null | undefined)[];
  /** String-valued tags used by toolbar filters. */
  filterValues?: Record<string, string | null | undefined>;
  /** Value submitted when a bulk action is invoked. Defaults to `key`. */
  bulkValue?: string;
  cells: React.ReactNode[];
};

type SortState = { index: number; direction: "asc" | "desc" };
const ALL_FILTER_VALUE = "__all__";

export type DataTableFilter = {
  key: string;
  label: string;
  allLabel?: string;
  options: { value: string; label: string }[];
};

export type DataTableBulkAction = {
  label: string;
  action: (formData: FormData) => void | Promise<void>;
  buttonVariant?: "default" | "outline" | "destructive";
  hiddenFields?: Record<string, string>;
};

function EmptyState({ title, description }: { title: string; description?: string }) {
  const Icon = description ? Inbox : SearchX;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4.5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function DataTableCard({
  title,
  sub,
  columns,
  rows,
  searchPlaceholder = "Search...",
  emptyTitle = "No results yet.",
  emptyDescription,
  pageSize = 10,
  compact = false,
  stackOnMobile = true,
  filters = [],
  bulkActions = [],
}: {
  title?: string;
  sub?: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  compact?: boolean;
  stackOnMobile?: boolean;
  filters?: DataTableFilter[];
  bulkActions?: DataTableBulkAction[];
}) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [filterState, setFilterState] = React.useState<Record<string, string>>(
    () => Object.fromEntries(filters.map((filter) => [filter.key, ALL_FILTER_VALUE]))
  );

  const searchable = !compact && rows.some((row) => row.searchValue !== undefined);
  const selectionEnabled = bulkActions.length > 0;

  const filteredBySearch = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => (row.searchValue ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  const filtered = React.useMemo(() => {
    return filteredBySearch.filter((row) =>
      filters.every((filter) => {
        const selectedValue = filterState[filter.key] ?? ALL_FILTER_VALUE;
        if (selectedValue === ALL_FILTER_VALUE) return true;
        return (row.filterValues?.[filter.key] ?? "") === selectedValue;
      })
    );
  }, [filteredBySearch, filters, filterState]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const { index, direction } = sort;
    const factor = direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a.sortValues?.[index];
      const bv = b.sortValues?.[index];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [filtered, sort]);

  function handleSearchChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleFilterChange(key: string, value: string | null) {
    setFilterState((current) => ({ ...current, [key]: value ?? ALL_FILTER_VALUE }));
    setPage(1);
  }

  function toggleSort(index: number) {
    setSort((current) => {
      if (!current || current.index !== index) return { index, direction: "asc" };
      if (current.direction === "asc") return { index, direction: "desc" };
      return null;
    });
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeSelected = React.useMemo(
    () => selected.filter((value) => sorted.some((row) => (row.bulkValue ?? row.key) === value)),
    [selected, sorted]
  );
  const selectedSet = React.useMemo(() => new Set(activeSelected), [activeSelected]);
  const allVisibleSelected =
    selectionEnabled &&
    pageRows.length > 0 &&
    pageRows.every((row) => selectedSet.has(row.bulkValue ?? row.key));

  function toggleAllVisible(next: boolean) {
    const visibleValues = pageRows.map((row) => row.bulkValue ?? row.key);
    setSelected(() => {
      const base = new Set(activeSelected);
      for (const value of visibleValues) {
        if (next) base.add(value);
        else base.delete(value);
      }
      return [...base];
    });
  }

  function toggleOne(value: string, next: boolean) {
    setSelected(() => {
      const base = new Set(activeSelected);
      if (next) base.add(value);
      else base.delete(value);
      return [...base];
    });
  }

  async function runBulkAction(actionConfig: DataTableBulkAction) {
    const formData = new FormData();
    for (const value of activeSelected) {
      formData.append("ids", value);
    }
    for (const [key, value] of Object.entries(actionConfig.hiddenFields ?? {})) {
      formData.append(key, value);
    }
    try {
      await actionConfig.action(formData);
      setSelected([]);
      toast.success(actionConfig.label);
    } catch {
      toast.error("Bulk action failed", "Please try again.");
    }
  }

  const cellPadding = compact ? "px-3 py-2" : undefined;

  return (
    <Card size={compact ? "sm" : "default"}>
      {title || sub || searchable ? (
        <CardHeader className="gap-3 border-b border-border/60 pb-(--card-spacing)">
          {title || sub ? (
            <div>
              {title ? <div className="text-heading text-[15px] text-foreground">{title}</div> : null}
              {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
            </div>
          ) : null}
          {searchable || filters.length > 0 || (selectionEnabled && selected.length > 0) ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
                {searchable ? (
                  <div className="relative max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="pl-9"
                    />
                  </div>
                ) : null}
                {filters.map((filter) => (
                  <div key={filter.key} className="w-full sm:w-52">
                      <Select
                      value={filterState[filter.key] ?? ALL_FILTER_VALUE}
                      onValueChange={(value) => handleFilterChange(filter.key, value)}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectPopup>
                        <SelectItem value={ALL_FILTER_VALUE}>
                          {filter.allLabel ?? `All ${filter.label.toLowerCase()}`}
                        </SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                  </div>
                ))}
              </div>
              {selectionEnabled && activeSelected.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {activeSelected.length} selected
                  </span>
                  {bulkActions.map((actionConfig) => (
                    <Button
                      key={actionConfig.label}
                      type="button"
                      size="sm"
                      variant={actionConfig.buttonVariant ?? "outline"}
                      onClick={() => void runBulkAction(actionConfig)}
                    >
                      {actionConfig.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardHeader>
      ) : null}

      <CardContent className="px-0">
        <div className={cn(stackOnMobile && "hidden sm:block")}>
          <Table>
            <TableHeader>
              <TableRow>
                {selectionEnabled ? (
                  <TableHead className={cellPadding}>
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(next) => toggleAllVisible(Boolean(next))}
                      aria-label="Select all visible rows"
                    />
                  </TableHead>
                ) : null}
                {columns.map((column, index) => {
                  const isSorted = sort?.index === index;
                  const Icon = isSorted
                    ? sort?.direction === "asc"
                      ? ChevronUp
                      : ChevronDown
                    : ChevronsUpDown;

                  return (
                    <TableHead
                      key={column.key}
                      className={cn(cellPadding, column.headerClassName)}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(index)}
                          className={cn(
                            "flex items-center gap-1 text-left transition-colors hover:text-foreground",
                            isSorted && "text-foreground"
                          )}
                        >
                          {column.header}
                          <Icon className={cn("size-3.5", !isSorted && "text-muted-foreground/50")} />
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (selectionEnabled ? 1 : 0)} className="whitespace-normal">
                    <EmptyState
                      title={query ? `No results for "${query}"` : emptyTitle}
                      description={!query ? emptyDescription : undefined}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow key={row.key}>
                    {selectionEnabled ? (
                      <TableCell className={cellPadding}>
                        <Checkbox
                          checked={selectedSet.has(row.bulkValue ?? row.key)}
                          onCheckedChange={(next) => toggleOne(row.bulkValue ?? row.key, Boolean(next))}
                          aria-label={`Select row ${row.key}`}
                        />
                      </TableCell>
                    ) : null}
                    {row.cells.map((cell, index) => (
                      <TableCell key={index} className={cellPadding}>
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {stackOnMobile ? (
          <div className="flex flex-col gap-3 p-4 sm:hidden">
            {pageRows.length === 0 ? (
              <EmptyState
                title={query ? `No results for "${query}"` : emptyTitle}
                description={!query ? emptyDescription : undefined}
              />
            ) : (
              pageRows.map((row) => {
                const middleCells = row.cells.slice(1, -1);
                const lastCell = row.cells.length > 1 ? row.cells[row.cells.length - 1] : null;

                return (
                  <div key={row.key} className="rounded-xl border border-border/60 p-3.5">
                    <div className="flex items-start gap-3">
                      {selectionEnabled ? (
                        <Checkbox
                          checked={selectedSet.has(row.bulkValue ?? row.key)}
                          onCheckedChange={(next) => toggleOne(row.bulkValue ?? row.key, Boolean(next))}
                          aria-label={`Select row ${row.key}`}
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-foreground">
                          {row.cells[0]}
                        </div>
                        {middleCells.length > 0 ? (
                          <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/60 pt-2.5">
                            {middleCells.map((cell, index) => (
                              <div key={index} className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                                  {columns[index + 1]?.header}
                                </span>
                                <span className="text-[13px] text-foreground">{cell}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {lastCell !== null ? (
                          <div className="mt-2.5 border-t border-border/60 pt-2.5">{lastCell}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </CardContent>

      {sorted.length > pageSize ? (
        <CardFooter>
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={sorted.length}
            onPageChange={setPage}
          />
        </CardFooter>
      ) : null}
    </Card>
  );
}
