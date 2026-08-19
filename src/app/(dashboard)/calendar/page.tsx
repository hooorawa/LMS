import { getSession } from "@/lib/auth/session";
import { getAcademicCalendarSnapshot, listUpcomingAcademicEvents } from "@/lib/data/academic-event.data";
import { CalendarView } from "./calendar-view";
export default async function CalendarPage() {
  const [session, events, snapshot] = await Promise.all([
    getSession(),
    listUpcomingAcademicEvents(),
    getAcademicCalendarSnapshot(),
  ]);

  return (
    <CalendarView
      canManage={session?.role === "institute-admin"}
      snapshot={snapshot}
      events={events.map((event) => ({
        id: String(event._id),
        title: event.title,
        type: event.type,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
        description: event.description ?? "",
      }))}
    />
  );
}
