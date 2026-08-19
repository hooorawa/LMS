"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-5 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred. Please try again."}
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>
      ) : null}
      <Button onClick={reset} variant="outline" className="mt-2">
        Try again
      </Button>
    </div>
  );
}
