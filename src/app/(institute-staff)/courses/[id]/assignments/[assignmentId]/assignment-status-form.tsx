import { Button } from "@/components/ui/button";
import { setAssignmentStatus } from "@/lib/actions/assignment.actions";
import type { AssignmentStatus } from "@/models/Assignment";

const TRANSITIONS: Record<AssignmentStatus, { label: string; status: AssignmentStatus }> = {
  draft: { label: "Publish", status: "published" },
  published: { label: "Move to draft", status: "draft" },
};

export function AssignmentStatusForm({
  assignmentId,
  status,
}: {
  assignmentId: string;
  status: AssignmentStatus;
}) {
  const transition = TRANSITIONS[status];

  return (
    <form action={setAssignmentStatus}>
      <input type="hidden" name="id" value={assignmentId} />
      <input type="hidden" name="status" value={transition.status} />
      <Button type="submit" variant="outline" size="sm">
        {transition.label}
      </Button>
    </form>
  );
}
