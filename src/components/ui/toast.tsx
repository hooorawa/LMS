"use client";

import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, X, XCircle } from "lucide-react";

import { toastManager } from "@/lib/toast";
import { cn } from "@/lib/utils";

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((item) => (
    <Toast.Root
      key={item.id}
      toast={item}
      className={cn(
        "shadow-panel-hover relative flex w-80 items-start gap-2.5 rounded-xl border bg-card p-4 pr-9 text-sm transition-all",
        "data-[ending-style]:translate-x-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-x-4 data-[starting-style]:opacity-0",
        item.type === "success" && "border-success/30",
        item.type === "error" && "border-destructive/30",
        !item.type && "border-border"
      )}
    >
      {item.type === "success" ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      ) : item.type === "error" ? (
        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
      ) : null}
      <div className="flex flex-col gap-0.5">
        <Toast.Title className="font-medium text-foreground" />
        {item.description ? (
          <Toast.Description className="text-xs text-muted-foreground" />
        ) : null}
      </div>
      <Toast.Close className="absolute top-3 right-3 text-muted-foreground transition-colors hover:text-foreground">
        <X className="size-3.5" />
      </Toast.Close>
    </Toast.Root>
  ));
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager}>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
