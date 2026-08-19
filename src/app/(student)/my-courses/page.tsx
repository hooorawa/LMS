import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, GraduationCap } from "lucide-react";
import { listEnrolledCoursesForStudent } from "@/lib/data/enrollment.data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function MyCoursesPage() {
  const courses = await listEnrolledCoursesForStudent();
  const activeCourses = courses.filter((course) => course.status === "active").length;
  const avgCompletion =
    courses.length > 0
      ? Math.round(courses.reduce((sum, course) => sum + course.percentComplete, 0) / courses.length)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="surface-subtle shadow-panel overflow-hidden rounded-[28px] border border-border/70 p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_.9fr] lg:items-end">
          <div>
            <p className="text-eyebrow text-primary">Student learning</p>
            <h1 className="text-heading mt-2 text-3xl sm:text-[2.1rem]">My Courses</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Pick up where you left off, keep track of progress, and jump into the next lesson with less friction.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Card size="sm">
              <CardContent className="flex items-center gap-3 pt-(--card-spacing)">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
                  <BookOpen className="size-4.5" />
                </div>
                <div>
                  <p className="text-eyebrow">Enrolled</p>
                  <p className="text-heading text-xl">{courses.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex items-center gap-3 pt-(--card-spacing)">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-success-subtle text-success">
                  <GraduationCap className="size-4.5" />
                </div>
                <div>
                  <p className="text-eyebrow">Active</p>
                  <p className="text-heading text-xl">{activeCourses}</p>
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="flex items-center gap-3 pt-(--card-spacing)">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-warning-subtle text-warning">
                  <Clock3 className="size-4.5" />
                </div>
                <div>
                  <p className="text-eyebrow">Average progress</p>
                  <p className="text-heading text-xl">{avgCompletion}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-[1.4rem] bg-primary-subtle text-primary">
                <BookOpen className="size-6" />
              </div>
              <h2 className="text-heading text-xl">No courses yet</h2>
              <p className="text-sm text-muted-foreground">
                You are not enrolled in any courses at the moment. Once your institute adds you, they will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.enrollmentId} className="group overflow-hidden">
              <CardContent className="flex h-full flex-col gap-4 pt-(--card-spacing)">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{course.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={course.status === "completed" ? "success" : "secondary"} className="capitalize">
                        {course.status}
                      </Badge>
                      <Badge variant="outline">{course.percentComplete}% complete</Badge>
                    </div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[1.2rem] bg-primary-subtle text-primary">
                    <BookOpen className="size-5" />
                  </div>
                </div>
                {course.description ? (
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {course.description}
                  </p>
                ) : null}

                <div className="mt-auto flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Progress</span>
                    <span>{course.percentComplete}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_oklch,var(--primary),white_18%),var(--primary))]"
                    style={{ width: `${course.percentComplete}%` }}
                  />
                </div>
                  <p className="text-xs text-muted-foreground">
                    {course.percentComplete > 0
                      ? "You have already started this course."
                      : "This course is ready for you to begin."}
                  </p>
                </div>

                <Link
                  href={`/my-courses/${course.courseId}`}
                  className={cn(buttonVariants({ size: "sm" }), "mt-1 self-start")}
                >
                  {course.percentComplete > 0 ? "Continue learning" : "Start course"}
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {courses.length > 0 ? (
        <div className="flex justify-end">
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Back to dashboard
          </Link>
        </div>
      ) : null}
    </div>
  );
}
