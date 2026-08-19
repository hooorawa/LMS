import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import UserModel from "@/models/User";
import AttendanceModel, {
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/models/Attendance";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listClassesForAttendanceTeacher() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const [classTeacherOf, taughtSubjects] = await Promise.all([
    ClassModel.find(withTenantScope({ classTeacherId: session.userId }, session)).lean(),
    SubjectModel.find(withTenantScope({ teacherId: session.userId }, session)).lean(),
  ]);

  const classTeacherIds = new Set(classTeacherOf.map((klass) => klass._id.toString()));
  const subjectClassIds = [
    ...new Set(
      taughtSubjects.flatMap((subject) =>
        subject.classIds.map((id: mongoose.Types.ObjectId) => id.toString())
      )
    ),
  ].filter((id) => !classTeacherIds.has(id));

  const extraClasses = subjectClassIds.length
    ? await ClassModel.find(withTenantScope({ _id: { $in: subjectClassIds } }, session)).lean()
    : [];

  const classes = [...classTeacherOf, ...extraClasses];

  return classes
    .map((klass) => ({
      id: klass._id.toString(),
      name: klass.name,
      section: klass.section,
      academicYear: klass.academicYear,
      isClassTeacher: classTeacherIds.has(klass._id.toString()),
      subjects: taughtSubjects
        .filter((subject) =>
          subject.classIds.some(
            (id: mongoose.Types.ObjectId) => id.toString() === klass._id.toString()
          )
        )
        .map((subject) => ({ id: subject._id.toString(), name: subject.name })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAttendanceMarkingContext(
  classId: string,
  subjectId: string | null,
  date: string
) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session)).lean();
  if (!klass) return null;

  if (subjectId) {
    const subject = await SubjectModel.findOne(
      withTenantScope({ _id: subjectId, teacherId: session.userId }, session)
    ).lean();
    if (
      !subject ||
      !subject.classIds.some((id: mongoose.Types.ObjectId) => id.toString() === classId)
    ) {
      throw new Error("Resource not found");
    }
  } else if (klass.classTeacherId?.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  const students = await UserModel.find({
    instituteId: session.instituteId,
    role: "student",
    "studentMeta.classId": classId,
  })
    .select("name studentMeta.rollNumber")
    .sort({ name: 1 })
    .lean();

  const attendanceDate = new Date(date);
  const existing = await AttendanceModel.findOne(
    withTenantScope({ classId, subjectId: subjectId || null, date: attendanceDate }, session)
  ).lean();

  const existingByStudent = new Map<string, AttendanceStatus>(
    (existing?.records ?? []).map((record: AttendanceRecord) => [
      record.studentId.toString(),
      record.status,
    ])
  );

  return {
    className: klass.name,
    students: students.map((student) => ({
      id: student._id.toString(),
      name: student.name,
      rollNumber: student.studentMeta?.rollNumber ?? "",
      status: existingByStudent.get(student._id.toString()) ?? "present",
    })),
  };
}

export async function listAttendanceHistoryForClass(classId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  return AttendanceModel.find(withTenantScope({ classId }, session))
    .populate("subjectId", "name")
    .sort({ date: -1 })
    .limit(30)
    .lean();
}

export async function getMyAttendanceHistory() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const docs = await AttendanceModel.find(
    withTenantScope({ "records.studentId": session.userId }, session)
  )
    .populate("classId", "name")
    .populate("subjectId", "name")
    .sort({ date: -1 })
    .lean();

  const history = docs.map((doc) => {
    const record = (doc.records as AttendanceRecord[]).find(
      (entry) => entry.studentId.toString() === session.userId
    );
    return {
      date: doc.date,
      className: (doc.classId as unknown as { name?: string } | null)?.name ?? "",
      subjectName: (doc.subjectId as unknown as { name?: string } | null)?.name ?? null,
      status: record?.status ?? "absent",
    };
  });

  const presentCount = history.filter(
    (entry) => entry.status === "present" || entry.status === "late"
  ).length;
  const percentPresent = history.length > 0 ? Math.round((presentCount / history.length) * 100) : 0;

  return { history, percentPresent };
}

export async function getAttendanceSummaryForTeacherClasses() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const [classTeacherOf, taughtSubjects] = await Promise.all([
    ClassModel.find(withTenantScope({ classTeacherId: session.userId }, session)).lean(),
    SubjectModel.find(withTenantScope({ teacherId: session.userId }, session)).lean(),
  ]);

  const classIds = new Set(classTeacherOf.map((klass) => klass._id.toString()));
  for (const subject of taughtSubjects) {
    for (const id of subject.classIds as mongoose.Types.ObjectId[]) {
      classIds.add(id.toString());
    }
  }

  if (classIds.size === 0) return [];

  const classes = await ClassModel.find({ _id: { $in: Array.from(classIds) } })
    .sort({ name: 1 })
    .lean();

  const rows = await AttendanceModel.aggregate([
    { $match: { classId: { $in: classes.map((klass) => klass._id) } } },
    { $unwind: "$records" },
    {
      $group: {
        _id: "$classId",
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $in: ["$records.status", ["present", "late"]] }, 1, 0],
          },
        },
      },
    },
  ]);

  const summaryByClass = new Map(rows.map((row) => [row._id.toString(), row]));

  return classes.map((klass) => {
    const summary = summaryByClass.get(klass._id.toString());
    const total = summary?.total ?? 0;
    const present = summary?.present ?? 0;
    return {
      id: klass._id.toString(),
      name: klass.section ? `${klass.name} ${klass.section}` : klass.name,
      percentPresent: total > 0 ? Math.round((present / total) * 100) : null,
    };
  });
}

export async function getInstituteAttendanceSummary() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const classes = await ClassModel.find(withTenantScope({}, session)).sort({ name: 1 }).lean();

  const rows = await AttendanceModel.aggregate([
    { $match: { instituteId: new mongoose.Types.ObjectId(session.instituteId as string) } },
    { $unwind: "$records" },
    {
      $group: {
        _id: "$classId",
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $in: ["$records.status", ["present", "late"]] }, 1, 0],
          },
        },
      },
    },
  ]);

  const summaryByClass = new Map(rows.map((row) => [row._id.toString(), row]));

  return classes.map((klass) => {
    const summary = summaryByClass.get(klass._id.toString());
    const total = summary?.total ?? 0;
    const present = summary?.present ?? 0;
    return {
      id: klass._id.toString(),
      name: klass.name,
      section: klass.section,
      percentPresent: total > 0 ? Math.round((present / total) * 100) : null,
    };
  });
}
