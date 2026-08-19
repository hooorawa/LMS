import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export type TeacherDashboardRow = {
  id: string;
  className: string;
  subjectName: string;
  academicYear: string;
  isClassTeacher: boolean;
};

export type TeacherDashboardData = {
  classCount: number;
  subjectCount: number;
  studentCount: number;
  rows: TeacherDashboardRow[];
};

type PopulatedClassRef = {
  _id: unknown;
  name: string;
  section?: string;
  academicYear: string;
};

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const [classTeacherOf, subjects] = await Promise.all([
    ClassModel.find(withTenantScope({ classTeacherId: session.userId }, session))
      .sort({ createdAt: -1 })
      .lean(),
    SubjectModel.find(withTenantScope({ teacherId: session.userId }, session))
      .populate("classIds", "name section academicYear")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const classTeacherClassIds = new Set(classTeacherOf.map((cls) => String(cls._id)));
  const allClassIds = new Set<string>();
  const rows: TeacherDashboardRow[] = [];

  for (const subject of subjects) {
    const classes = (subject.classIds ?? []) as unknown as PopulatedClassRef[];
    for (const cls of classes) {
      const classId = String(cls._id);
      allClassIds.add(classId);
      rows.push({
        id: `${subject._id}-${classId}`,
        className: cls.section ? `${cls.name} ${cls.section}` : cls.name,
        subjectName: subject.name,
        academicYear: cls.academicYear,
        isClassTeacher: classTeacherClassIds.has(classId),
      });
    }
  }

  for (const cls of classTeacherOf) {
    const classId = String(cls._id);
    if (allClassIds.has(classId)) continue;
    allClassIds.add(classId);
    rows.push({
      id: `class-teacher-${classId}`,
      className: cls.section ? `${cls.name} ${cls.section}` : cls.name,
      subjectName: "—",
      academicYear: cls.academicYear,
      isClassTeacher: true,
    });
  }

  const studentCount = allClassIds.size
    ? await UserModel.countDocuments({
        instituteId: session.instituteId,
        role: "student",
        "studentMeta.classId": { $in: Array.from(allClassIds) },
      })
    : 0;

  return {
    classCount: allClassIds.size,
    subjectCount: subjects.length,
    studentCount,
    rows,
  };
}
