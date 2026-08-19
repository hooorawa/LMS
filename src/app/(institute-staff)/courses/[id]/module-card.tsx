import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { renameModule, deleteModule, moveModule } from "@/lib/actions/module.actions";
import { deleteLesson, moveLesson } from "@/lib/actions/lesson.actions";
import { AddLessonForm } from "./add-lesson-form";
import { LessonEditDialog } from "./lessons/[lessonId]/edit/lesson-edit-dialog";

const TYPE_LABEL: Record<string, string> = {
  video: "Video",
  pdf: "PDF",
  text: "Text",
  link: "Link",
};

type LessonSummary = {
  _id: unknown;
  title: string;
  type: string;
  isPreview?: boolean;
  contentUrl?: string;
  textBody?: string;
  durationSeconds?: number | null;
};

export function ModuleCard({
  courseId,
  module: courseModule,
  isFirst,
  isLast,
}: {
  courseId: string;
  module: {
    _id: unknown;
    title: string;
    lessons: LessonSummary[];
  };
  isFirst: boolean;
  isLast: boolean;
}) {
  const moduleId = String(courseModule._id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{courseModule.title}</CardTitle>
        <div className="flex items-center gap-1.5">
          <form action={moveModule}>
            <input type="hidden" name="id" value={moduleId} />
            <input type="hidden" name="direction" value="up" />
            <Button type="submit" variant="outline" size="icon-sm" disabled={isFirst} title="Move up">
              ↑
            </Button>
          </form>
          <form action={moveModule}>
            <input type="hidden" name="id" value={moduleId} />
            <input type="hidden" name="direction" value="down" />
            <Button type="submit" variant="outline" size="icon-sm" disabled={isLast} title="Move down">
              ↓
            </Button>
          </form>
          <ConfirmDeleteButton
            action={deleteModule}
            hiddenFields={{ id: moduleId }}
            itemLabel="module"
            triggerLabel="Delete module"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={renameModule} className="flex items-center gap-2">
          <input type="hidden" name="id" value={moduleId} />
          <Input name="title" defaultValue={courseModule.title} className="max-w-xs" />
          <Button type="submit" variant="outline" size="sm">
            Rename
          </Button>
        </form>

        {courseModule.lessons.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {courseModule.lessons.map((lesson, index) => {
              const lessonId = String(lesson._id);
              return (
                <li
                  key={lessonId}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lesson.title}</span>
                    <Badge variant="secondary">{TYPE_LABEL[lesson.type] ?? lesson.type}</Badge>
                    {lesson.isPreview ? <Badge variant="secondary">Preview</Badge> : null}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <form action={moveLesson}>
                      <input type="hidden" name="id" value={lessonId} />
                      <input type="hidden" name="direction" value="up" />
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon-sm"
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </Button>
                    </form>
                    <form action={moveLesson}>
                      <input type="hidden" name="id" value={lessonId} />
                      <input type="hidden" name="direction" value="down" />
                      <Button
                        type="submit"
                        variant="outline"
                        size="icon-sm"
                        disabled={index === courseModule.lessons.length - 1}
                        title="Move down"
                      >
                        ↓
                      </Button>
                    </form>
                    <LessonEditDialog
                      lessonId={lessonId}
                      courseId={courseId}
                      title={lesson.title}
                      type={lesson.type as "video" | "pdf" | "text" | "link"}
                      contentUrl={lesson.contentUrl ?? ""}
                      textBody={lesson.textBody ?? ""}
                      durationSeconds={lesson.durationSeconds ?? null}
                      isPreview={lesson.isPreview ?? false}
                    />
                    <ConfirmDeleteButton
                      action={deleteLesson}
                      hiddenFields={{ id: lessonId }}
                      itemLabel="lesson"
                      triggerLabel="×"
                      size="icon-sm"
                      title="Delete"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No lessons yet.</p>
        )}

        <AddLessonForm moduleId={moduleId} courseId={courseId} />
      </CardContent>
    </Card>
  );
}
