"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  startClass,
  startBreak,
  endBreak,
  endClass,
  markAttemptAttendance,
  type ClassSessionState,
} from "@/lib/actions/class-session.actions";
import type { ClassSessionStatus, ClassBreakStatus } from "@/models/Class";

const initialState: ClassSessionState = {};

const SESSION_BADGE: Record<ClassSessionStatus, "secondary" | "success" | "outline" | "warning"> = {
  scheduled: "secondary",
  ongoing: "success",
  completed: "outline",
  cancelled: "warning",
};

function LifecycleButton({
  action,
  classId,
  label,
  pendingLabel,
  variant = "default",
}: {
  action: typeof startClass;
  classId: string;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="classId" value={classId} />
      <Button type="submit" disabled={pending} variant={variant}>
        {pending ? pendingLabel : label}
      </Button>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}

export function SessionControls({
  classId,
  sessionStatus,
  breakStatus,
  totalBreakDuration,
  roster,
}: {
  classId: string;
  sessionStatus: ClassSessionStatus;
  breakStatus: ClassBreakStatus;
  totalBreakDuration: number;
  roster: {
    id: string;
    name: string;
    rollNumber: string;
    joined: boolean;
    attendance: "pending" | "attended" | "absent";
    joinedAt: Date | null;
    leftAt: Date | null;
  }[];
}) {
  const isOngoing = sessionStatus === "ongoing";
  const joinedCount = roster.filter((student) => student.joined).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Session controls</CardTitle>
          <Badge variant={SESSION_BADGE[sessionStatus]}>{sessionStatus}</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {!isOngoing ? (
            <LifecycleButton action={startClass} classId={classId} label="Start class" pendingLabel="Starting..." />
          ) : (
            <>
              {breakStatus === "on_break" ? (
                <LifecycleButton
                  action={endBreak}
                  classId={classId}
                  label="End break"
                  pendingLabel="Ending break..."
                  variant="outline"
                />
              ) : (
                <LifecycleButton
                  action={startBreak}
                  classId={classId}
                  label="Start break"
                  pendingLabel="Starting break..."
                  variant="outline"
                />
              )}
              <LifecycleButton
                action={endClass}
                classId={classId}
                label="End class"
                pendingLabel="Ending..."
                variant="destructive"
              />
            </>
          )}
          <span className="text-sm text-muted-foreground">
            {joinedCount}/{roster.length} joined · {totalBreakDuration} min on break
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>
          ) : (
            roster.map((student) => (
              <RosterRow key={student.id} classId={classId} student={student} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RosterRow({
  classId,
  student,
}: {
  classId: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    joined: boolean;
    attendance: "pending" | "attended" | "absent";
  };
}) {
  const [state, formAction, pending] = useActionState(markAttemptAttendance, initialState);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
      <div>
        <p className="text-sm font-medium">{student.name}</p>
        {student.rollNumber ? (
          <p className="text-xs text-muted-foreground">Roll no. {student.rollNumber}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={student.joined ? "success" : "secondary"}>
          {student.joined ? "Joined" : "Not joined"}
        </Badge>
        <Badge
          variant={
            student.attendance === "attended"
              ? "success"
              : student.attendance === "absent"
                ? "destructive"
                : "secondary"
          }
        >
          {student.attendance}
        </Badge>
        <form action={formAction} className="flex items-center gap-1">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="studentId" value={student.id} />
          <Button
            type="submit"
            name="attendance"
            value="attended"
            size="xs"
            variant="outline"
            disabled={pending}
          >
            Mark attended
          </Button>
          <Button
            type="submit"
            name="attendance"
            value="absent"
            size="xs"
            variant="outline"
            disabled={pending}
          >
            Mark absent
          </Button>
        </form>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </div>
  );
}
