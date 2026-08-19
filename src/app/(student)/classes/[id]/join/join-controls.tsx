"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { joinClass, leaveClass, type ClassSessionState } from "@/lib/actions/class-session.actions";
import type { ClassSessionStatus } from "@/models/Class";

const initialState: ClassSessionState = {};

const SESSION_LABEL: Record<ClassSessionStatus, string> = {
  scheduled: "Not started yet",
  ongoing: "Live now",
  completed: "Ended",
  cancelled: "Cancelled",
};

export function JoinControls({
  classId,
  sessionStatus,
  attempt,
}: {
  classId: string;
  sessionStatus: ClassSessionStatus;
  attempt: { status: string; attendance: string; joinedAt: Date | null; leftAt: Date | null } | null;
}) {
  const [state, formAction, pending] = useActionState(joinClass, initialState);
  const [leaveState, leaveAction, leaving] = useActionState(leaveClass, initialState);
  const isOngoing = sessionStatus === "ongoing";
  const hasJoined = attempt?.status === "active";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Live session</CardTitle>
        <Badge variant={isOngoing ? "success" : "secondary"}>{SESSION_LABEL[sessionStatus]}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasJoined ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-success">You have joined this session.</p>
            <form action={leaveAction}>
              <input type="hidden" name="classId" value={classId} />
              <Button type="submit" variant="outline" size="sm" disabled={leaving}>{leaving ? "Leaving..." : "Leave class"}</Button>
            </form>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="classId" value={classId} />
            <Button type="submit" disabled={pending || !isOngoing}>
              {pending ? "Joining..." : "Join class"}
            </Button>
          </form>
        )}
        {!isOngoing && !hasJoined ? (
          <p className="text-sm text-muted-foreground">
            The session isn&apos;t live yet — check back once your teacher starts it.
          </p>
        ) : null}
        {state.error || leaveState.error ? <p className="text-sm text-destructive">{state.error ?? leaveState.error}</p> : null}
        {attempt ? (
          <p className="text-sm text-muted-foreground">
            Attendance: <span className="font-medium text-foreground">{attempt.attendance}</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
