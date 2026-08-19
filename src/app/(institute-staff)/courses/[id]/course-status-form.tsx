import { Button } from "@/components/ui/button";
import { setCourseStatus } from "@/lib/actions/course.actions";
import type { CourseStatus } from "@/models/Course";

const TRANSITIONS: Record<CourseStatus, { label: string; status: CourseStatus }[]> = {
  draft: [{ label: "Publish", status: "published" }],
  published: [{ label: "Archive", status: "archived" }],
  archived: [{ label: "Move to draft", status: "draft" }],
};

export function CourseStatusForm({ courseId, status }: { courseId: string; status: CourseStatus }) {
  return (
    <div className="flex items-center gap-2">
      {TRANSITIONS[status].map((transition) => (
        <form action={setCourseStatus} key={transition.status}>
          <input type="hidden" name="id" value={courseId} />
          <input type="hidden" name="status" value={transition.status} />
          <Button type="submit" variant="outline" size="sm">
            {transition.label}
          </Button>
        </form>
      ))}
    </div>
  );
}
