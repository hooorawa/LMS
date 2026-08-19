import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel from "@/models/Assignment";
import { getSession, assertSameInstitute } from "@/lib/tenant/scope";
import { assertEnrolledInCourse } from "@/lib/actions/enrollment-ownership";
import { buildObjectKey, createUploadUrl } from "@/lib/storage/s3";

const ALLOWED_SUBMISSION_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "application/zip",
];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const assignmentId = body?.assignmentId;
  const fileName = body?.fileName;
  const contentType = body?.contentType;

  if (
    typeof assignmentId !== "string" ||
    typeof fileName !== "string" ||
    typeof contentType !== "string" ||
    !ALLOWED_SUBMISSION_CONTENT_TYPES.includes(contentType)
  ) {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  await connectToDatabase();

  const assignment = await AssignmentModel.findById(assignmentId).lean();
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }
  try {
    assertSameInstitute(assignment, session);
  } catch {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  const enrollment = await assertEnrolledInCourse(assignment.courseId.toString(), session);
  if (!enrollment) {
    return NextResponse.json({ error: "Not enrolled in this course." }, { status: 403 });
  }

  const key = buildObjectKey(
    { instituteId: session.instituteId as string, courseId: assignment.courseId.toString() },
    fileName
  );
  const uploadUrl = await createUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
