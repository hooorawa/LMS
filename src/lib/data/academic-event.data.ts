import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AcademicEventModel from "@/models/AcademicEvent";
import AcademicTermModel from "@/models/AcademicTerm";
import { requireSession, withTenantScope } from "@/lib/tenant/scope";

export async function listUpcomingAcademicEvents(limit = 30) {
  const session = await requireSession();
  await connectToDatabase();
  return AcademicEventModel.find(withTenantScope({ startsAt: { $gte: new Date() } }, session))
    .sort({ startsAt: 1 })
    .limit(limit)
    .lean();
}

export async function getAcademicCalendarSnapshot() {
  const session = await requireSession();
  await connectToDatabase();

  const now = new Date();
  const [events, activeTerm, upcomingTerm] = await Promise.all([
    AcademicEventModel.find(withTenantScope({ startsAt: { $gte: now } }, session))
      .sort({ startsAt: 1 })
      .limit(30)
      .lean(),
    AcademicTermModel.findOne(
      withTenantScope({ startsAt: { $lte: now }, endsAt: { $gte: now } }, session)
    )
      .sort({ startsAt: 1 })
      .lean(),
    AcademicTermModel.findOne(withTenantScope({ startsAt: { $gt: now } }, session))
      .sort({ startsAt: 1 })
      .lean(),
  ]);

  const counts = {
    exams: events.filter((event) => event.type === "exam").length,
    deadlines: events.filter((event) => event.type === "deadline").length,
    holidays: events.filter((event) => event.type === "holiday").length,
    classes: events.filter((event) => event.type === "class").length,
    events: events.filter((event) => event.type === "event").length,
  };

  return {
    counts,
    activeTerm: activeTerm
      ? {
          id: String(activeTerm._id),
          name: activeTerm.name,
          academicYear: activeTerm.academicYear,
          startsAt: activeTerm.startsAt,
          endsAt: activeTerm.endsAt,
          status: activeTerm.status,
        }
      : null,
    upcomingTerm: upcomingTerm
      ? {
          id: String(upcomingTerm._id),
          name: upcomingTerm.name,
          academicYear: upcomingTerm.academicYear,
          startsAt: upcomingTerm.startsAt,
          endsAt: upcomingTerm.endsAt,
          status: upcomingTerm.status,
        }
      : null,
  };
}
