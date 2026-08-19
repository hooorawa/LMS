import { config } from "dotenv";
config({ path: ".env.local" });

import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import SubjectModel from "@/models/Subject";
import AuditLogModel from "@/models/AuditLog";
import { hashPassword } from "@/lib/auth/password";

const DEMO_PASSWORD = "Password123!";

async function wipeInstitute(code: string) {
  const existing = await InstituteModel.findOne({ code });
  if (!existing) return;

  const instituteId = existing._id;
  await Promise.all([
    UserModel.deleteMany({ instituteId }),
    ClassModel.deleteMany({ instituteId }),
    SubjectModel.deleteMany({ instituteId }),
    AuditLogModel.deleteMany({ instituteId }),
  ]);
  await InstituteModel.deleteOne({ _id: instituteId });
}

async function main() {
  await connectToDatabase();

  await wipeInstitute("NPS");
  await wipeInstitute("RIV");

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // --- Institute 1: fully populated ---
  const nps = await InstituteModel.create({
    name: "Northgate Public School",
    code: "NPS",
    status: "active",
    plan: "growth",
    contactEmail: "info@nps.edu",
    phone: "011-234-5678",
    address: "42 Galle Road, Colombo",
  });

  const admin = await UserModel.create({
    name: "Asha Perera",
    email: "admin@nps.edu",
    passwordHash,
    role: "institute-admin",
    instituteId: nps._id,
    status: "active",
    mustChangePassword: false,
  });

  await InstituteModel.updateOne({ _id: nps._id }, { createdBy: admin._id });

  const teacherDefs = [
    { name: "Nadeesha Silva", email: "nadeesha.silva@nps.edu", employeeCode: "T-1001" },
    { name: "Kasun Fernando", email: "kasun.fernando@nps.edu", employeeCode: "T-1002" },
    { name: "Ishara Jayasuriya", email: "ishara.jayasuriya@nps.edu", employeeCode: "T-1003" },
    {
      name: "Ruwan Bandara",
      email: "ruwan.bandara@nps.edu",
      employeeCode: "T-1004",
      status: "suspended" as const,
    },
  ];

  const teachers = await Promise.all(
    teacherDefs.map((t) =>
      UserModel.create({
        name: t.name,
        email: t.email,
        passwordHash,
        role: "institute-staff",
        instituteId: nps._id,
        status: t.status ?? "active",
        mustChangePassword: t.name === "Nadeesha Silva",
        staffMeta: { employeeCode: t.employeeCode },
        createdBy: admin._id,
      })
    )
  );
  const [nadeesha, kasun, ishara, ruwan] = teachers;

  const classDefs = [
    { name: "Grade 6", section: "A", classTeacherId: kasun._id },
    { name: "Grade 6", section: "B", classTeacherId: null },
    { name: "Grade 7", section: "A", classTeacherId: ishara._id },
    { name: "Grade 8", section: "A", classTeacherId: ruwan._id },
  ];

  const classes = await Promise.all(
    classDefs.map((c) =>
      ClassModel.create({
        instituteId: nps._id,
        name: c.name,
        section: c.section,
        academicYear: "2025/2026",
        classTeacherId: c.classTeacherId,
        status: "active",
        createdBy: admin._id,
      })
    )
  );
  const [class6a, class6b, class7a, class8a] = classes;

  const subjectDefs = [
    { name: "Mathematics", code: "MATH101", teacherId: nadeesha._id, classIds: [class6a, class6b, class7a, class8a] },
    { name: "Science", code: "SCI101", teacherId: kasun._id, classIds: [class6a, class6b] },
    { name: "English", code: "ENG101", teacherId: ishara._id, classIds: [class6a, class6b, class7a, class8a] },
    { name: "History", code: "HIST101", teacherId: ruwan._id, classIds: [class7a, class8a] },
    { name: "ICT", code: "ICT101", teacherId: ruwan._id, classIds: [class8a] },
  ];

  const subjects = await Promise.all(
    subjectDefs.map((s) =>
      SubjectModel.create({
        instituteId: nps._id,
        name: s.name,
        code: s.code,
        teacherId: s.teacherId,
        classIds: s.classIds.map((c) => c._id),
        createdBy: admin._id,
      })
    )
  );

  await Promise.all(
    teachers.map((teacher) => {
      const subjectIds = subjects
        .filter((s) => String(s.teacherId) === String(teacher._id))
        .map((s) => s._id);
      return UserModel.updateOne({ _id: teacher._id }, { "staffMeta.subjectIds": subjectIds });
    })
  );

  const studentDefs: { name: string; classId: (typeof classes)[number]; status?: "active" | "suspended" }[] = [
    { name: "Tharindu Wickramasinghe", classId: class6a },
    { name: "Sanduni Rathnayake", classId: class6a },
    { name: "Dilshan Gunasekara", classId: class6a },
    { name: "Amaya Weerasinghe", classId: class6a },
    { name: "Chamod Ekanayake", classId: class6a },
    { name: "Hiruni Abeysekara", classId: class6a },
    { name: "Nimesh Karunaratne", classId: class6b },
    { name: "Yashodha Senanayake", classId: class6b },
    { name: "Isuru Madushanka", classId: class6b },
    { name: "Piumi Dissanayake", classId: class6b },
    { name: "Lakshan Rajapaksha", classId: class6b, status: "suspended" },
    { name: "Nethmi Wijesuriya", classId: class7a },
    { name: "Sachini Peiris", classId: class7a },
    { name: "Ravindu Mendis", classId: class7a },
    { name: "Vihanga Kodikara", classId: class7a },
    { name: "Anjali Herath", classId: class7a },
    { name: "Kavindu Ranasinghe", classId: class8a },
    { name: "Thisari Amarasekara", classId: class8a },
    { name: "Malith Gamage", classId: class8a },
    { name: "Oshadi Liyanage", classId: class8a },
  ];

  const students = await Promise.all(
    studentDefs.map((s, i) => {
      const rollNumber = `NPS-${String(i + 1).padStart(4, "0")}`;
      const slug = s.name.toLowerCase().replace(/[^a-z]+/g, ".");
      return UserModel.create({
        name: s.name,
        email: `${slug}@students.nps.edu`,
        passwordHash,
        role: "student",
        instituteId: nps._id,
        status: s.status ?? "active",
        mustChangePassword: i === 0,
        studentMeta: {
          rollNumber,
          classId: s.classId._id,
          guardianName: `${s.name.split(" ")[0]}'s Guardian`,
          guardianPhone: "077-000-0000",
        },
        createdBy: admin._id,
      });
    })
  );

  const now = Date.now();
  const auditEntries = [
    {
      actorName: admin.name,
      action: "class.create",
      targetType: "Class",
      targetId: class8a._id,
      targetName: "Grade 8 A",
      summary: "created class Grade 8 A",
      minutesAgo: 15,
    },
    {
      actorName: admin.name,
      action: "student.create",
      targetType: "User",
      targetId: students[students.length - 1]._id,
      targetName: students[students.length - 1].name,
      summary: `enrolled student ${students[students.length - 1].name}`,
      minutesAgo: 45,
    },
    {
      actorName: admin.name,
      action: "staff.create",
      targetType: "User",
      targetId: ruwan._id,
      targetName: ruwan.name,
      summary: `added staff member ${ruwan.name}`,
      minutesAgo: 180,
    },
    {
      actorName: admin.name,
      action: "subject.create",
      targetType: "Subject",
      targetId: subjects[4]._id,
      targetName: "ICT",
      summary: "created subject ICT",
      minutesAgo: 320,
    },
    {
      actorName: admin.name,
      action: "class.update",
      targetType: "Class",
      targetId: class6a._id,
      targetName: "Grade 6 A",
      summary: "assigned Kasun Fernando as class teacher for Grade 6 A",
      minutesAgo: 1440,
    },
    {
      actorName: admin.name,
      action: "student.create",
      targetType: "User",
      targetId: students[0]._id,
      targetName: students[0].name,
      summary: `enrolled student ${students[0].name}`,
      minutesAgo: 2880,
    },
  ];

  await AuditLogModel.insertMany(
    auditEntries.map((e) => ({
      instituteId: nps._id,
      actorUserId: admin._id,
      actorName: e.actorName,
      actorRole: "institute-admin",
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      targetName: e.targetName,
      summary: e.summary,
      createdAt: new Date(now - e.minutesAgo * 60 * 1000),
    }))
  );

  // --- Institute 2: minimal, for super-admin's institutes list ---
  const riverside = await InstituteModel.create({
    name: "Riverside Academy",
    code: "RIV",
    status: "trial",
    plan: "free",
    contactEmail: "hello@riverside.edu",
  });

  const riversideAdmin = await UserModel.create({
    name: "Malsha Rodrigo",
    email: "admin@riverside.edu",
    passwordHash,
    role: "institute-admin",
    instituteId: riverside._id,
    status: "active",
    mustChangePassword: false,
  });

  await InstituteModel.updateOne({ _id: riverside._id }, { createdBy: riversideAdmin._id });

  console.log("Seed complete.");
  console.log("");
  console.log(`Shared demo password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Northgate Public School (fully populated):");
  console.log(`  institute-admin : admin@nps.edu`);
  console.log(`  staff (temp pw required)   : nadeesha.silva@nps.edu`);
  console.log(`  staff                     : kasun.fernando@nps.edu`);
  console.log(`  staff                     : ishara.jayasuriya@nps.edu`);
  console.log(`  staff (suspended)                : ruwan.bandara@nps.edu`);
  console.log(`  student (temp pw required): ${students[0].email}`);
  console.log(`  student                   : ${students[1].email}`);
  console.log("");
  console.log("Riverside Academy (minimal, empty lists):");
  console.log(`  institute-admin : admin@riverside.edu`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
