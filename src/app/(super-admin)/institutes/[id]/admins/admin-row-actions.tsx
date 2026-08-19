"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LogIn, MoreHorizontal, Trash2 } from "lucide-react";
import {
  resetInstituteAdminPassword,
  removeInstituteAdmin,
  type ResetInstituteAdminPasswordState,
} from "@/lib/actions/institute.actions";
import { startImpersonation } from "@/lib/actions/impersonation.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

const resetInitialState: ResetInstituteAdminPasswordState = {};

export function AdminRowActions({ userId, adminName }: { userId: string; adminName: string }) {
  const router = useRouter();
  const [resetState, setResetState] = React.useState<ResetInstituteAdminPasswordState>(resetInitialState);
  const [resetting, startResetTransition] = React.useTransition();
  const [removing, startRemoveTransition] = React.useTransition();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  function handleImpersonate() {
    const formData = new FormData();
    formData.set("instituteAdminUserId", userId);
    void startImpersonation(formData);
  }

  function handleResetPassword() {
    startResetTransition(async () => {
      const formData = new FormData();
      formData.set("userId", userId);
      const result = await resetInstituteAdminPassword(resetInitialState, formData);
      setResetState(result);
      if (result.error) {
        toast.error("Couldn't reset password", result.error);
      }
    });
  }

  function handleRemove() {
    startRemoveTransition(async () => {
      const formData = new FormData();
      formData.set("userId", userId);
      const result = await removeInstituteAdmin({}, formData);
      if (result.error) {
        toast.error(`Couldn't remove ${adminName}`, result.error);
        return;
      }
      setConfirmOpen(false);
      toast.success(`${adminName} removed`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions for {adminName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleImpersonate}>
            <LogIn />
            Impersonate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword} disabled={resetting}>
            {resetting ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Reset password
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {resetState.success ? (
        <span className="font-mono text-xs">New password: {resetState.success.tempPassword}</span>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogPopup tone="danger">
          <DialogHeader>
            <DialogTitle>Remove {adminName}?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className={buttonVariants({ variant: "outline", size: "sm" })} type="button">
              Cancel
            </DialogClose>
            <Button type="button" variant="destructive" size="sm" disabled={removing} onClick={handleRemove}>
              {removing ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
