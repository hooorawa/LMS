import { NextResponse } from "next/server";
import { listStudents } from "@/lib/data/user.data";
import { listFeesForInstitute } from "@/lib/data/fee.data";
import { listAuditLogs } from "@/lib/data/audit.data";
import { listAcademicTermsForInstitute } from "@/lib/data/deep-operations.data";
import { listUpcomingAcademicEvents } from "@/lib/data/academic-event.data";
import { toCsv, type CsvColumn } from "@/lib/reports/csv";
import { toXlsxBuffer } from "@/lib/reports/xlsx";

type ExportPayload<T extends Record<string, unknown>> = {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
};

async function buildStudentsExport(): Promise<ExportPayload<Record<string, unknown>>> {
  const students = await listStudents();
  const rows = students.map((student) => ({
    name: student.name,
    email: student.email,
    rollNumber: student.studentMeta?.rollNumber ?? "",
    birthday: student.studentMeta?.birthday ? new Date(student.studentMeta.birthday).toLocaleDateString() : "",
    gender: student.studentMeta?.gender ?? "",
    guardianName: student.studentMeta?.guardianName ?? "",
    guardianPhone: student.studentMeta?.guardianPhone ?? "",
    registrationDate: student.studentMeta?.registrationDate ? new Date(student.studentMeta.registrationDate).toLocaleDateString() : "",
    paymentType: student.studentMeta?.paymentType ?? "",
    status: student.status,
    createdAt: student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "",
  }));
  return {
    rows,
    columns: [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "rollNumber", header: "Roll number" },
      { key: "birthday", header: "Birthday" },
      { key: "gender", header: "Gender" },
      { key: "guardianName", header: "Guardian name" },
      { key: "guardianPhone", header: "Guardian phone" },
      { key: "registrationDate", header: "Registration date" },
      { key: "paymentType", header: "Payment type" },
      { key: "status", header: "Status" },
      { key: "createdAt", header: "Created" },
    ],
    filename: "students",
  };
}

async function buildFeesExport(): Promise<ExportPayload<Record<string, unknown>>> {
  const fees = await listFeesForInstitute();
  const rows = fees.map((fee) => {
    const klass = fee.classId as unknown as { name?: string; section?: string } | null;
    const student = fee.studentId as unknown as { name?: string } | null;
    const scope = student
      ? `Student: ${student.name}`
      : klass
        ? `Class: ${klass.name}${klass.section ? ` - ${klass.section}` : ""}`
        : "Institute-wide";
    return {
      title: fee.title,
      scope,
      amount: fee.amount,
      dueDate: new Date(fee.dueDate).toLocaleDateString(),
      frequency: fee.frequency,
    };
  });
  return {
    rows,
    columns: [
      { key: "title", header: "Title" },
      { key: "scope", header: "Scope" },
      { key: "amount", header: "Amount" },
      { key: "dueDate", header: "Due date" },
      { key: "frequency", header: "Frequency" },
    ],
    filename: "fees",
  };
}

async function buildAuditLogExport(searchParams: URLSearchParams): Promise<ExportPayload<Record<string, unknown>>> {
  const filters = {
    instituteId: searchParams.get("instituteId") || undefined,
    actorRole: searchParams.get("actorRole") || undefined,
    action: searchParams.get("action") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
  };

  const { logs } = await listAuditLogs(filters, 1, 10000);
  const rows = logs.map((log) => {
    const institute = log.instituteId as unknown as { name?: string } | null;
    return {
      when: log.createdAt ? new Date(log.createdAt as unknown as string).toLocaleString() : "",
      actorName: log.actorName,
      actorRole: log.actorRole,
      institute: institute?.name ?? "Platform",
      action: log.action,
      summary: log.summary,
    };
  });
  return {
    rows,
    columns: [
      { key: "when", header: "When" },
      { key: "actorName", header: "Actor" },
      { key: "actorRole", header: "Actor role" },
      { key: "institute", header: "Institute" },
      { key: "action", header: "Action" },
      { key: "summary", header: "Summary" },
    ],
    filename: "audit-log",
  };
}

async function buildTermsExport(): Promise<ExportPayload<Record<string, unknown>>> {
  const terms = await listAcademicTermsForInstitute();
  const rows = terms.map((term) => ({
    name: term.name,
    academicYear: term.academicYear,
    startsAt: new Date(term.startsAt).toLocaleDateString(),
    endsAt: new Date(term.endsAt).toLocaleDateString(),
    status: term.status,
    createdAt: term.createdAt ? new Date(term.createdAt).toLocaleDateString() : "",
  }));

  return {
    rows,
    columns: [
      { key: "name", header: "Term" },
      { key: "academicYear", header: "Academic year" },
      { key: "startsAt", header: "Start" },
      { key: "endsAt", header: "End" },
      { key: "status", header: "Status" },
      { key: "createdAt", header: "Created" },
    ],
    filename: "academic-terms",
  };
}

async function buildCalendarEventsExport(): Promise<ExportPayload<Record<string, unknown>>> {
  const events = await listUpcomingAcademicEvents(500);
  const rows = events.map((event) => ({
    title: event.title,
    type: event.type,
    startsAt: new Date(event.startsAt).toLocaleString(),
    endsAt: event.endsAt ? new Date(event.endsAt).toLocaleString() : "",
    description: event.description ?? "",
  }));

  return {
    rows,
    columns: [
      { key: "title", header: "Title" },
      { key: "type", header: "Type" },
      { key: "startsAt", header: "Starts at" },
      { key: "endsAt", header: "Ends at" },
      { key: "description", header: "Description" },
    ],
    filename: "calendar-events",
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  let payload: ExportPayload<Record<string, unknown>>;

  if (type === "students") {
    payload = await buildStudentsExport();
  } else if (type === "fees") {
    payload = await buildFeesExport();
  } else if (type === "terms") {
    payload = await buildTermsExport();
  } else if (type === "calendar-events") {
    payload = await buildCalendarEventsExport();
  } else if (type === "audit-log") {
    payload = await buildAuditLogExport(url.searchParams);
  } else {
    return NextResponse.json({ error: "Unknown export type." }, { status: 400 });
  }

  if (format === "xlsx") {
    const buffer = await toXlsxBuffer(payload.rows, payload.columns, payload.filename);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${payload.filename}.xlsx"`,
      },
    });
  }

  const csv = toCsv(payload.rows, payload.columns);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${payload.filename}.csv"`,
    },
  });
}
