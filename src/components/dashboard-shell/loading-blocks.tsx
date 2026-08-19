import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AUTH_CARD_CLASS,
  AUTH_CARD_WRAPPER_CLASS,
  AUTH_FORM_COLUMN_CLASS,
  AUTH_HERO_PANEL_CLASS,
  AuthCardBackdrop,
} from "@/components/auth/auth-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TableSkeleton({
  columns = 4,
  rows = 6,
  withHeaderAction = true,
}: {
  columns?: number;
  rows?: number;
  withHeaderAction?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        {withHeaderAction ? <Skeleton className="h-9 w-28" /> : null}
      </div>
      <Card className="mt-6">
        <CardHeader className="border-b border-border/60 pb-(--card-spacing)">
          <Skeleton className="h-10 w-full max-w-xs" />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: columns }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, r) => (
                <TableRow key={r}>
                  {Array.from({ length: columns }).map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-40" />
        </CardFooter>
      </Card>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="mt-2 h-9 w-28" />
      </CardContent>
    </Card>
  );
}

export function DetailSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <React.Fragment key={i}>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-2 pt-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
      <TableSkeleton columns={4} rows={4} withHeaderAction={false} />
    </div>
  );
}

export function CardListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CenteredFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <main className={AUTH_CARD_WRAPPER_CLASS}>
      <div className={AUTH_HERO_PANEL_CLASS} />
      <div className={cn("relative", AUTH_FORM_COLUMN_CLASS)}>
        <AuthCardBackdrop />
        <div className={cn("relative", AUTH_CARD_CLASS)}>
          <div className="flex flex-col items-center gap-3 pb-6">
            <Skeleton className="size-10 rounded-(--radius-icon)" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: fields }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
            <Skeleton className="mt-2 h-9 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
