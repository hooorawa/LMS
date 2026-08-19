import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnrolledCourseForStudent } from "@/lib/data/enrollment.data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  text: "Text",
  link: "Link",
};

export default async function StudentCourseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getEnrolledCourseForStudent(id);

  if (!course) {
    notFound();
  }

  const teacher = course.teacherId as unknown as { name?: string } | null;
  const subject = course.subjectId as unknown as { name?: string } | null;

  type CourseModule = (typeof course.modules)[number];
  type ModuleLesson = CourseModule["lessons"][number];

  const allLessons = course.modules.flatMap((courseModule: CourseModule) => courseModule.lessons);
  const nextLesson =
    allLessons.find((lesson: ModuleLesson) => !lesson.isComplete) ?? allLessons[0];
  const completedLessons = allLessons.filter((lesson: ModuleLesson) => lesson.isComplete).length;

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader
        eyebrow={subject?.name ?? "My learning"}
        title={course.title}
        description={course.description ?? "Your course materials, assessments, and learning progress are all organised here."}
        metrics={[
          { label: "Course progress", value: `${course.percentComplete}%`, detail: "Lessons marked complete", tone: course.percentComplete === 100 ? "success" : "primary" },
          { label: "Lessons complete", value: `${completedLessons}/${allLessons.length}`, detail: "Across all modules", tone: "info" },
          { label: "Teaching team", value: teacher?.name ? "1" : "-", detail: teacher?.name ?? "Teacher not assigned", tone: "success" },
        ]}
      />

      <div className="flex items-center gap-4">
        <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${course.percentComplete}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">{course.percentComplete}% complete</span>
        <Link href={`/my-courses/${id}/assignments`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Assignments
        </Link>
        <Link href={`/my-courses/${id}/quizzes`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Quizzes
        </Link>
        {nextLesson ? (
          <Link
            href={`/my-courses/${id}/lessons/${String(nextLesson._id)}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {course.percentComplete > 0 ? "Continue" : "Start"}
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {course.modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">This course has no content yet.</p>
        ) : (
          course.modules.map((courseModule: CourseModule) => (
            <Card key={String(courseModule._id)}>
              <CardHeader>
                <CardTitle>{courseModule.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {courseModule.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lessons yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {courseModule.lessons.map((lesson: ModuleLesson) => (
                      <li key={String(lesson._id)}>
                        <Link
                          href={`/my-courses/${id}/lessons/${String(lesson._id)}`}
                          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                                lesson.isComplete
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border"
                              )}
                            >
                              {lesson.isComplete ? "✓" : ""}
                            </span>
                            <span className="font-medium">{lesson.title}</span>
                          </span>
                          <Badge variant="secondary">{TYPE_LABEL[lesson.type] ?? lesson.type}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
