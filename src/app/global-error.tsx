"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred. Please try again."}
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>
          ) : null}
          <button
            onClick={reset}
            className="mt-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
