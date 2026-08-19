import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectToDatabase } from "@/lib/db/connect";
import PaymentModel from "@/models/Payment";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import EnrollmentModel from "@/models/Enrollment";
import GradeModel from "@/models/Grade";
import AttendanceModel, { type AttendanceRecord } from "@/models/Attendance";
import { getSession, assertSameInstitute } from "@/lib/tenant/scope";
import { FeeReceiptDocument, type FeeReceiptData } from "@/lib/reports/fee-receipt";
import { ReportCardDocument, type ReportCardData, type ReportCardGradeRow } from "@/lib/reports/report-card";
import {
  EnrollmentConfirmationDocument,
  type EnrollmentConfirmationData,
} from "@/lib/reports/enrollment-confirmation";
import { FeeStatementDocument, type FeeStatementData } from "@/lib/reports/fee-statement";
import { getStudentFeeOverview } from "@/lib/data/fee.data";

async function buildReceipt(id: string, session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const payment = await PaymentModel.findById(id).populate("feeId", "title");
  if (!payment) return null;

  assertSameInstitute(payment, session);

  if (session.role === "student" && payment.studentId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }
  if (!["institute-admin", "student"].includes(session.role)) {
    throw new Error("Resource not found");
  }

  const [institute, student, recordedBy] = await Promise.all([
    InstituteModel.findById(payment.instituteId).select("name").lean(),
    UserModel.findById(payment.studentId).select("name studentMeta.rollNumber").lean(),
    UserModel.findById(payment.recordedBy).select("name").lean(),
  ]);

  const feeRef = payment.feeId as unknown as { title?: string } | null;

  const data: FeeReceiptData = {
    instituteName: institute?.name ?? "Institute",
    receiptNumber: payment.receiptNumber,
    paymentDate: new Date(payment.paymentDate).toLocaleDateString(),
    studentName: student?.name ?? "Unknown student",
    rollNumber: student?.studentMeta?.rollNumber ?? "",
    feeTitle: feeRef?.title ?? null,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes ?? null,
    recordedByName: recordedBy?.name ?? "Unknown",
  };

  return data;
}

async function buildReportCard(
  studentId: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>
) {
  const student = await UserModel.findById(studentId)
    .select("name role instituteId studentMeta.classId studentMeta.rollNumber")
    .lean();
  if (!student || student.role !== "student") return null;

  assertSameInstitute(student, session);

  if (session.role === "student" && session.userId !== studentId) {
    throw new Error("Resource not found");
  }
  if (!["institute-admin", "student"].includes(session.role)) {
    throw new Error("Resource not found");
  }

  const [institute, klass, grades, attendanceDocs] = await Promise.all([
    InstituteModel.findById(student.instituteId).select("name").lean(),
    student.studentMeta?.classId
      ? ClassModel.findById(student.studentMeta.classId)
          .select("name section academicYear")
          .lean()
      : null,
    GradeModel.find({ studentId })
      .populate("courseId", "title")
      .populate("subjectId", "name")
      .lean(),
    AttendanceModel.find({
      instituteId: student.instituteId,
      "records.studentId": studentId,
    }).lean(),
  ]);

  const groups = new Map<string, { title: string; score: number; maxScore: number }>();
  for (const grade of grades) {
    const course = grade.courseId as unknown as { _id: string; title?: string } | null;
    const subject = grade.subjectId as unknown as { _id: string; name?: string } | null;
    const key = course ? course._id.toString() : `subject-${subject?._id?.toString() ?? "none"}`;
    const group = groups.get(key) ?? {
      title: course?.title ?? (subject?.name ? `${subject.name} exams` : "Exams"),
      score: 0,
      maxScore: 0,
    };
    group.score += grade.score * grade.weight;
    group.maxScore += grade.maxScore * grade.weight;
    groups.set(key, group);
  }

  const gradeRows: ReportCardGradeRow[] = Array.from(groups.values()).map((group) => ({
    title: group.title,
    score: group.score,
    maxScore: group.maxScore,
    percent: group.maxScore > 0 ? (group.score / group.maxScore) * 100 : null,
  }));

  let presentCount = 0;
  for (const doc of attendanceDocs) {
    const record = (doc.records as AttendanceRecord[]).find(
      (entry) => entry.studentId.toString() === studentId
    );
    if (record && (record.status === "present" || record.status === "late")) {
      presentCount += 1;
    }
  }
  const attendancePercent =
    attendanceDocs.length > 0 ? Math.round((presentCount / attendanceDocs.length) * 100) : 0;

  const overallScore = gradeRows.reduce((sum, group) => sum + group.score, 0);
  const overallMax = gradeRows.reduce((sum, group) => sum + group.maxScore, 0);

  const data: ReportCardData = {
    instituteName: institute?.name ?? "Institute",
    studentName: student.name,
    rollNumber: student.studentMeta?.rollNumber ?? "",
    className: klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "-",
    academicYear: klass?.academicYear ?? "",
    generatedDate: new Date().toLocaleDateString(),
    attendancePercent,
    overallPercent: overallMax > 0 ? (overallScore / overallMax) * 100 : null,
    grades: gradeRows,
  };

  return data;
}

async function buildEnrollmentConfirmation(
  studentId: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>
) {
  const student = await UserModel.findById(studentId)
    .select("name role instituteId studentMeta.classId studentMeta.rollNumber")
    .lean();
  if (!student || student.role !== "student") return null;

  assertSameInstitute(student, session);

  if (session.role === "student" && session.userId !== studentId) {
    throw new Error("Resource not found");
  }
  if (!["institute-admin", "student"].includes(session.role)) {
    throw new Error("Resource not found");
  }

  const [institute, klass, activeCourseCount] = await Promise.all([
    InstituteModel.findById(student.instituteId).select("name").lean(),
    student.studentMeta?.classId
      ? ClassModel.findById(student.studentMeta.classId)
          .select("name section academicYear")
          .lean()
      : null,
    EnrollmentModel.countDocuments({
      instituteId: student.instituteId,
      studentId,
      status: "active",
    }),
  ]);

  const data: EnrollmentConfirmationData = {
    instituteName: institute?.name ?? "Institute",
    studentName: student.name,
    rollNumber: student.studentMeta?.rollNumber ?? "",
    className: klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "-",
    academicYear: klass?.academicYear ?? "",
    activeCourseCount,
    generatedDate: new Date().toLocaleDateString(),
  };

  return data;
}

async function buildFeeStatement(
  studentId: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>
) {
  if (session.role === "student" && session.userId !== studentId) {
    throw new Error("Resource not found");
  }
  if (!["institute-admin", "student"].includes(session.role)) {
    throw new Error("Resource not found");
  }

  const overview = await getStudentFeeOverview(studentId);
  if (!overview) return null;

  const institute = await InstituteModel.findById(session.instituteId).select("name").lean();

  const data: FeeStatementData = {
    instituteName: institute?.name ?? "Institute",
    studentName: overview.student.name,
    rollNumber: overview.student.rollNumber,
    generatedDate: new Date().toLocaleDateString(),
    totalDue: overview.totalDue,
    totalPaid: overview.totalPaid,
    balance: overview.balance,
    fees: overview.fees.map((fee) => ({
      title: fee.title,
      amount: fee.amount,
      discount: fee.discount,
      paid: fee.paid,
      balance: fee.balance,
      dueDate: new Date(fee.dueDate).toLocaleDateString(),
    })),
  };

  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { type, id } = await params;

  await connectToDatabase();

  if (type === "receipt") {
    let data: FeeReceiptData | null;
    try {
      data = await buildReceipt(id, session);
    } catch {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    const buffer = await renderToBuffer(<FeeReceiptDocument data={data} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${data.receiptNumber}.pdf"`,
      },
    });
  }

  if (type === "report-card") {
    let data: ReportCardData | null;
    try {
      data = await buildReportCard(id, session);
    } catch {
      return NextResponse.json({ error: "Report card not found." }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Report card not found." }, { status: 404 });
    }

    const buffer = await renderToBuffer(<ReportCardDocument data={data} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-card-${data.studentName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  }

  if (type === "enrollment-confirmation") {
    let data: EnrollmentConfirmationData | null;
    try {
      data = await buildEnrollmentConfirmation(id, session);
    } catch {
      return NextResponse.json({ error: "Enrollment confirmation not found." }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Enrollment confirmation not found." }, { status: 404 });
    }

    const buffer = await renderToBuffer(<EnrollmentConfirmationDocument data={data} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="enrollment-confirmation-${data.studentName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  }

  if (type === "fee-statement") {
    let data: FeeStatementData | null;
    try {
      data = await buildFeeStatement(id, session);
    } catch {
      return NextResponse.json({ error: "Fee statement not found." }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "Fee statement not found." }, { status: 404 });
    }

    const buffer = await renderToBuffer(<FeeStatementDocument data={data} />);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fee-statement-${data.studentName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown report type." }, { status: 400 });
}
