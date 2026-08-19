import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listAnnouncementsForInstitute, listAnnouncementsForTeacher, listAnnouncementsVisibleToStudent, listClassesForAnnouncementTeacher } from "@/lib/data/announcement.data";
import { listClasses } from "@/lib/data/class.data";
import { listPublishedCoursesForInstitute, listCoursesForTeacher } from "@/lib/data/course.data";
import { deleteAnnouncement } from "@/lib/actions/announcement.actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";
import { AnnouncementFormDialog } from "./new/announcement-form-dialog";

type PopulatedRef = { name?: string; section?: string; title?: string } | null;

function scopeLabel(announcement: { audience: string; classId: unknown; courseId: unknown }) {
  if (announcement.audience === "class") { const klass = announcement.classId as PopulatedRef; return `Class: ${klass?.name ?? "-"}${klass?.section ? ` - ${klass.section}` : ""}`; }
  if (announcement.audience === "course") { const course = announcement.courseId as PopulatedRef; return `Course: ${course?.title ?? "-"}`; }
  return "Institute-wide";
}

export default async function AnnouncementsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "super-admin") redirect("/dashboard");

  const canPost = session.role === "institute-admin" || session.role === "institute-staff";
  const announcements = session.role === "institute-admin" ? await listAnnouncementsForInstitute() : session.role === "institute-staff" ? await listAnnouncementsForTeacher() : await listAnnouncementsVisibleToStudent();
  let announcementDialog: ReactNode = null;
  if (canPost) {
    const [classes, courses] = session.role === "institute-admin" ? await Promise.all([listClasses(), listPublishedCoursesForInstitute()]) : await Promise.all([listClassesForAnnouncementTeacher(), listCoursesForTeacher()]);
    announcementDialog = <AnnouncementFormDialog allowInstitute={session.role === "institute-admin"} classes={classes.map((klass) => ({ id: String(klass._id), name: klass.name, section: klass.section }))} courses={courses.map((course) => ({ id: String(course._id), title: course.title }))} />;
  }

  const content = <div className="flex flex-col gap-4">{announcements.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No announcements yet. Publish an update to keep your community aligned.</div> : announcements.map((announcement) => { const creator = (announcement as { createdBy?: PopulatedRef }).createdBy; return <article key={String(announcement._id)} className="surface-subtle rounded-2xl border border-border/70 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{announcement.title}</p><span className="mt-2 inline-block rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-medium text-primary">{scopeLabel(announcement)}</span></div><span className="shrink-0 text-xs text-muted-foreground">{new Date(announcement.publishedAt).toLocaleDateString()}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.body}</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3"><span className="text-xs text-muted-foreground">{creator?.name ? `Posted by ${creator.name}` : "Institute communication"}</span>{session.role !== "student" ? <ConfirmDeleteButton action={deleteAnnouncement} hiddenFields={{ id: String(announcement._id) }} itemLabel={announcement.title} /> : null}</div></article>; })}</div>;

  if (session.role === "institute-admin") return <div className="flex flex-col gap-6"><WorkspaceHeader eyebrow="Institute communication" title="Announcements" description="Publish timely updates to the entire institute, a class, or a course, and keep everyone aligned." actions={announcementDialog} metrics={[{ label: "Published updates", value: announcements.length, detail: "Visible institute communication", tone: "primary" }, { label: "Institute-wide", value: announcements.filter((item) => item.audience === "institute").length, detail: "Reaching every learner", tone: "success" }, { label: "Targeted updates", value: announcements.filter((item) => item.audience !== "institute").length, detail: "Class or course specific", tone: "info" }]} />{content}</div>;
  if (session.role === "student") return <div className="flex flex-col gap-6"><StudentWorkspaceHeader eyebrow="Institute communication" title="Announcements" description="Stay connected with updates shared by your institute, classes, and courses." metrics={[{ label: "Updates available", value: announcements.length, detail: "Visible to you", tone: "primary" }, { label: "Institute-wide", value: announcements.filter((item) => item.audience === "institute").length, detail: "For every learner", tone: "success" }, { label: "Targeted updates", value: announcements.filter((item) => item.audience !== "institute").length, detail: "For your classes or courses", tone: "info" }]} />{content}</div>;
  return <div className="flex flex-col gap-6"><WorkspaceHeader eyebrow="Teaching" title="Announcements" description="Post updates to your classes and courses." actions={announcementDialog} metrics={[{ label: "Your announcements", value: announcements.length, detail: "Posted so far", tone: "primary" }, { label: "Class updates", value: announcements.filter((item) => item.audience === "class").length, detail: "Targeted to a class", tone: "success" }, { label: "Course updates", value: announcements.filter((item) => item.audience === "course").length, detail: "Targeted to a course", tone: "info" }]} />{content}</div>;
}
