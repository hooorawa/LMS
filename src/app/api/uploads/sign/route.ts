import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import CourseModel from "@/models/Course";
import { getSession, assertSameInstitute } from "@/lib/tenant/scope";
import { buildObjectKey, createUploadUrl } from "@/lib/storage/s3";

const ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (session.role !== "institute-staff") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const courseId = body?.courseId;
  const fileName = body?.fileName;
  const contentType = body?.contentType;

  if (
    typeof courseId !== "string" ||
    typeof fileName !== "string" ||
    typeof contentType !== "string" ||
    !ALLOWED_CONTENT_TYPES.includes(contentType)
  ) {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  await connectToDatabase();

  const course = await CourseModel.findById(courseId).lean();
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  try {
    assertSameInstitute(course, session);
  } catch {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  if (course.teacherId.toString() !== session.userId) {
    return NextResponse.json({ error: "You do not own this course." }, { status: 403 });
  }

  const key = buildObjectKey(
    { instituteId: session.instituteId as string, courseId },
    fileName
  );
  const uploadUrl = await createUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
