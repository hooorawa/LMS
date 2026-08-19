import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseForTeacher } from "@/lib/data/course.data";
import { listSubjectsForTeacher } from "@/lib/data/subject.data";
import { listClassesForTeacher } from "@/lib/data/class.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/models/Course";
import { CourseStatusForm } from "./course-status-form";
import { ModuleCard } from "./module-card";
import { AddModuleForm } from "./add-module-form";
import { CourseEditDialog } from "./edit/course-edit-dialog";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, subjectsList, classesList] = await Promise.all([
    getCourseForTeacher(id),
    listSubjectsForTeacher(),
    listClassesForTeacher(),
  ]);

  if (!course) {
    notFound();
  }

  const subject = course.subjectId as unknown as { name?: string } | null;
  const classes = (course.classIds ?? []) as unknown as { name: string; section?: string }[];
  const courseSubjectId = course.subjectId as unknown as { _id?: unknown } | null;
  const courseClassIds = (course.classIds ?? []) as unknown as { _id: unknown }[];
  const subjectOptions = subjectsList.map((s) => ({ id: String(s._id), name: s.name }));
  const classOptions = classesList.map((klass) => ({
    id: String(klass._id),
    label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          {course.description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{course.status}</span>
            {subject?.name ? <span>Subject: {subject.name}</span> : null}
            {classes.length > 0 ? (
              <span>
                Classes:{" "}
                {classes.map((c) => (c.section ? `${c.name} ${c.section}` : c.name)).join(", ")}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}/assignments`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Assignments
          </Link>
          <Link
            href={`/courses/${id}/quizzes`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Quizzes
          </Link>
          <CourseEditDialog
            courseId={id}
            title={course.title}
            description={course.description ?? ""}
            subjectId={courseSubjectId?._id ? String(courseSubjectId._id) : ""}
            classIds={courseClassIds.map((c) => String(c._id))}
            status={course.status}
            subjects={subjectOptions}
            classes={classOptions}
          />
          <CourseStatusForm courseId={id} status={course.status as CourseStatus} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {course.modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No modules yet. Add your first module below to start building lessons.
          </p>
        ) : (
          course.modules.map((courseModule: (typeof course.modules)[number], index: number) => (
            <ModuleCard
              key={String(courseModule._id)}
              courseId={id}
              module={courseModule}
              isFirst={index === 0}
              isLast={index === course.modules.length - 1}
            />
          ))
        )}
      </div>

      <AddModuleForm courseId={id} />
    </div>
  );
}
