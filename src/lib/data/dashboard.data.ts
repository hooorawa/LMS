import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import AuditLogModel from "@/models/AuditLog";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { getIncomeStatistics, type IncomeStatistics } from "@/lib/data/finance.data";

export type InstituteDashboardCounts = {
  teachers: number;
  students: number;
  classes: number;
  subjects: number;
};

export async function getInstituteDashboardCounts(): Promise<InstituteDashboardCounts> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [teachers, students, classes, subjects] = await Promise.all([
    UserModel.countDocuments(withTenantScope({ role: "institute-staff" }, session)),
    UserModel.countDocuments(withTenantScope({ role: "student" }, session)),
    ClassModel.countDocuments(withTenantScope({}, session)),
    SubjectModel.countDocuments(withTenantScope({}, session)),
  ]);

  return { teachers, students, classes, subjects };
}

export async function getInstituteFinanceSummary(): Promise<IncomeStatistics> {
  return getIncomeStatistics();
}

export async function getCurrentUserProfile(
  userId: string,
  role: string,
): Promise<{ name: string; role: string }> {
  await connectToDatabase();
  const user = await UserModel.findById(userId).select("name").lean();

  return { name: user?.name ?? "User", role };
}

export type RecentActivityEntry = {
  id: string;
  actorName: string;
  action: string;
  summary: string;
  targetName?: string;
  createdAt: Date;
};

export async function getInstituteRecentActivity(limit = 5): Promise<RecentActivityEntry[]> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const logs = await AuditLogModel.find(withTenantScope({}, session))
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("actorName action summary targetName createdAt")
    .lean();

  return logs.map((log) => ({
    id: String(log._id),
    actorName: log.actorName,
    action: log.action,
    summary: log.summary,
    targetName: log.targetName ?? undefined,
    createdAt: log.createdAt,
  }));
}

export async function getTeacherRecentActivity(limit = 5): Promise<RecentActivityEntry[]> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();
  const logs = await AuditLogModel.find(
    withTenantScope({ actorUserId: session.userId }, session)
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("actorName action summary targetName createdAt")
    .lean();

  return logs.map((log) => ({
    id: String(log._id),
    actorName: log.actorName,
    action: log.action,
    summary: log.summary,
    targetName: log.targetName ?? undefined,
    createdAt: log.createdAt,
  }));
}

export type ClassOverviewRow = {
  id: string;
  name: string;
  section?: string;
  academicYear: string;
  classTeacherName: string;
  studentCount: number;
};

export async function getInstituteClassesOverview(limit = 5): Promise<ClassOverviewRow[]> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  const classes = await ClassModel.find(withTenantScope({}, session))
    .populate("classTeacherId", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return Promise.all(
    classes.map(async (cls) => {
      const studentCount = await UserModel.countDocuments({
        instituteId: session.instituteId,
        role: "student",
        "studentMeta.classId": cls._id,
      });

      const classTeacher = cls.classTeacherId as unknown as { name?: string } | null;

      return {
        id: String(cls._id),
        name: cls.name,
        section: cls.section ?? undefined,
        academicYear: cls.academicYear,
        classTeacherName: classTeacher?.name ?? "Unassigned",
        studentCount,
      };
    })
  );
}
