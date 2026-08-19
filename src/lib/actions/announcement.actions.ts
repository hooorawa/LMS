"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import AnnouncementModel from "@/models/Announcement";
import NotificationModel from "@/models/Notification";
import ClassModel from "@/models/Class";
import CourseModel from "@/models/Course";
import UserModel from "@/models/User";
import EnrollmentModel from "@/models/Enrollment";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";
import { assertCanAnnounceToClass } from "@/lib/actions/class-subject-ownership";
import { recordAuditEntry } from "@/lib/audit/log";
import { createAnnouncementSchema } from "@/lib/validation/announcement.schema";
import type { SessionPayload } from "@/lib/auth/session";

export type CreateAnnouncementState = {
  error?: string;
  success?: {
    announcementId: string;
    recipientCount: number;
  };
};

async function resolveRecipientIds(
  audience: "institute" | "class" | "course",
  classId: string | null,
  courseId: string | null,
  session: SessionPayload
): Promise<string[]> {
  if (audience === "institute") {
    const users = await UserModel.find(withTenantScope({ "notificationPreferences.announcements": { $ne: false } }, session)).select("_id");
    return users.map((user) => user._id.toString());
  }

  if (audience === "class") {
    const students = await UserModel.find({
      instituteId: session.instituteId,
      role: "student",
      "studentMeta.classId": classId,
      "notificationPreferences.announcements": { $ne: false },
    }).select("_id");
    const klass = await ClassModel.findById(classId).select("classTeacherId").lean();
    const ids = students.map((student) => student._id.toString());
    if (klass?.classTeacherId) {
      ids.push(klass.classTeacherId.toString());
    }
    return [...new Set(ids)];
  }

  const enrollments = await EnrollmentModel.find({ courseId, status: "active" }).select("studentId");
  const candidates = enrollments.map((enrollment) => enrollment.studentId);
  const users = await UserModel.find({ _id: { $in: candidates }, "notificationPreferences.announcements": { $ne: false } }).select("_id");
  return users.map((user) => user._id.toString());
}

export async function createAnnouncement(
  _prevState: CreateAnnouncementState,
  formData: FormData
): Promise<CreateAnnouncementState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin", "institute-staff"]);

  const parsed = createAnnouncementSchema.safeParse({
    audience: formData.get("audience"),
    classId: formData.get("classId"),
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { audience, title, body } = parsed.data;
  const classId = parsed.data.classId || null;
  const courseId = parsed.data.courseId || null;

  await connectToDatabase();

  let classRefName: string | null = null;
  let courseRefTitle: string | null = null;

  if (audience === "institute") {
    if (session.role !== "institute-admin") {
      return { error: "Only an institute-admin can post an institute-wide announcement." };
    }
  } else if (audience === "class") {
    if (session.role === "institute-admin") {
      const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session));
      if (!klass) return { error: "Class not found in your institute." };
      classRefName = klass.name;
    } else {
      const klass = await assertCanAnnounceToClass(classId as string, session);
      if (!klass) return { error: "You are not the class teacher for that class." };
      classRefName = klass.name;
    }
  } else {
    if (session.role === "institute-admin") {
      const course = await CourseModel.findOne(withTenantScope({ _id: courseId }, session));
      if (!course) return { error: "Course not found in your institute." };
      courseRefTitle = course.title;
    } else {
      const course = await assertOwnsCourse(courseId as string, session);
      if (!course) return { error: "You do not teach that course." };
      courseRefTitle = course.title;
    }
  }

  const announcement = await AnnouncementModel.create({
    instituteId: session.instituteId,
    courseId: audience === "course" ? courseId : null,
    classId: audience === "class" ? classId : null,
    title,
    body,
    audience,
    createdBy: session.userId,
  });

  const recipientIds = await resolveRecipientIds(audience, classId, courseId, session);

  if (recipientIds.length > 0) {
    await NotificationModel.insertMany(
      recipientIds.map((userId) => ({
        instituteId: session.instituteId,
        userId,
        type: "announcement",
        title,
        body,
        link: "/announcements",
        isRead: false,
      }))
    );
  }

  const actor = await UserModel.findById(session.userId).select("name");
  const scopeLabel =
    audience === "institute"
      ? "the institute"
      : audience === "class"
        ? `class "${classRefName}"`
        : `course "${courseRefTitle}"`;

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "announcement.create",
    targetType: "Announcement",
    targetId: announcement._id.toString(),
    targetName: announcement.title,
    summary: `Posted announcement "${announcement.title}" to ${scopeLabel} (${recipientIds.length} recipient${recipientIds.length === 1 ? "" : "s"})`,
    after: { title, audience, recipientCount: recipientIds.length },
  });

  revalidatePath("/announcements");

  return { success: { announcementId: announcement._id.toString(), recipientCount: recipientIds.length } };
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin", "institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const announcement = await AnnouncementModel.findOne(withTenantScope({ _id: id }, session));
  if (!announcement) return;

  if (session.role === "institute-staff") {
    if (announcement.createdBy.toString() !== session.userId) return;
  }

  await AnnouncementModel.deleteOne({ _id: announcement._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "announcement.delete",
    targetType: "Announcement",
    targetId: announcement._id.toString(),
    targetName: announcement.title,
    summary: `Deleted announcement "${announcement.title}"`,
    before: { title: announcement.title, audience: announcement.audience },
  });

  revalidatePath("/announcements");
}
