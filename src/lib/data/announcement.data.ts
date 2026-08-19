import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AnnouncementModel from "@/models/Announcement";
import UserModel from "@/models/User";
import EnrollmentModel from "@/models/Enrollment";
import ClassModel from "@/models/Class";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listClassesForAnnouncementTeacher() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();
  return ClassModel.find(withTenantScope({ classTeacherId: session.userId }, session))
    .sort({ name: 1 })
    .lean();
}

export async function listAnnouncementsForInstitute() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  return AnnouncementModel.find(withTenantScope({}, session))
    .populate("classId", "name section")
    .populate("courseId", "title")
    .populate("createdBy", "name")
    .sort({ publishedAt: -1 })
    .lean();
}

export async function listAnnouncementsForTeacher() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  return AnnouncementModel.find(
    withTenantScope({ createdBy: session.userId }, session)
  )
    .populate("classId", "name section")
    .populate("courseId", "title")
    .sort({ publishedAt: -1 })
    .lean();
}

export async function listAnnouncementsVisibleToStudent() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const student = await UserModel.findById(session.userId)
    .select("studentMeta.classId")
    .lean();
  const classId = student?.studentMeta?.classId ?? null;

  const enrollments = await EnrollmentModel.find({
    studentId: session.userId,
    status: "active",
  }).select("courseId");
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);

  return AnnouncementModel.find({
    instituteId: session.instituteId,
    $or: [
      { audience: "institute" },
      ...(classId ? [{ audience: "class", classId }] : []),
      ...(courseIds.length ? [{ audience: "course", courseId: { $in: courseIds } }] : []),
    ],
  })
    .populate("classId", "name section")
    .populate("courseId", "title")
    .populate("createdBy", "name")
    .sort({ publishedAt: -1 })
    .lean();
}
