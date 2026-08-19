import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { listSubmissionsForAssignment } from "@/lib/data/submission.data";
import { GradeSubmissionForm } from "./grade-submission-form";

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const data = await listSubmissionsForAssignment(assignmentId);

  if (!data) {
    notFound();
  }

  const { assignment, submissions } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/courses/${id}/assignments/${assignmentId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {assignment.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length === 1 ? "" : "s"}
        </p>
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((submission) => {
            const student = submission.studentId as unknown as {
              _id: string;
              name?: string;
              email?: string;
            };

            return (
              <div
                key={submission._id.toString()}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{student?.name ?? "Unknown student"}</p>
                    <p className="text-xs text-muted-foreground">{student?.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {submission.status}
                  </Badge>
                </div>

                {submission.textResponse ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm">{submission.textResponse}</p>
                ) : null}

                {submission.attachmentUrl ? (
                  <a
                    href={submission.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm underline"
                  >
                    View attachment
                  </a>
                ) : null}

                <div className="mt-4 border-t border-border pt-4">
                  <GradeSubmissionForm
                    submissionId={submission._id.toString()}
                    maxScore={assignment.maxScore}
                    score={submission.grade?.score}
                    feedback={submission.grade?.feedback}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
