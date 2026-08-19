"use client";
import { useActionState, useEffect } from "react";
import { CalendarDays, Clock3, Plus } from "lucide-react";
import { createAcademicEvent, deleteAcademicEvent, type AcademicEventState } from "@/lib/actions/academic-event.actions";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
type Event = { id: string; title: string; type: string; startsAt: string; endsAt: string | null; description: string };
type CalendarSnapshot = {
  counts: {
    exams: number;
    deadlines: number;
    holidays: number;
    classes: number;
    events: number;
  };
  activeTerm: { name: string; academicYear: string; startsAt: Date; endsAt: Date; status: string } | null;
  upcomingTerm: { name: string; academicYear: string; startsAt: Date; endsAt: Date; status: string } | null;
};
const initial: AcademicEventState = {};
function AddEvent() { const [state, action, pending] = useActionState(createAcademicEvent, initial); useEffect(() => { if (state.error) toast.error("Could not add event", state.error); if (state.success) toast.success("Calendar event added"); }, [state]); return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4 text-primary" />Add institute event</CardTitle></CardHeader><CardContent><form action={action} className="grid gap-3 sm:grid-cols-2"><Input name="title" placeholder="Event title" required /><select name="type" className="h-10 rounded-xl border border-input bg-card px-3 text-sm"><option value="event">Institute event</option><option value="exam">Exam</option><option value="holiday">Holiday</option><option value="deadline">Deadline</option><option value="class">Class activity</option></select><Input name="startsAt" type="datetime-local" required /><Input name="endsAt" type="datetime-local" /><Textarea name="description" placeholder="Description (optional)" className="sm:col-span-2" /><Button type="submit" disabled={pending} className="sm:justify-self-start">{pending ? "Adding..." : "Add event"}</Button></form></CardContent></Card>; }
export function CalendarView({ canManage, events, snapshot }: { canManage: boolean; events: Event[]; snapshot: CalendarSnapshot }) { return <div className="flex flex-col gap-6"><div><p className="text-eyebrow text-primary">Academic life</p><h1 className="text-heading mt-1 text-2xl">Calendar</h1><p className="mt-1 text-sm text-muted-foreground">Your institute&apos;s upcoming classes, exams, deadlines, and events.</p></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Active term</CardTitle></CardHeader><CardContent><p className="font-semibold">{snapshot.activeTerm?.name ?? "No active term"}</p><p className="text-sm text-muted-foreground">{snapshot.activeTerm?.academicYear ?? "Create terms to anchor planning."}</p></CardContent></Card><Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Upcoming exams</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{snapshot.counts.exams}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Deadlines</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{snapshot.counts.deadlines}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Holidays</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{snapshot.counts.holidays}</CardContent></Card></div>{canManage ? <AddEvent /> : null}<Card><CardContent className="pt-(--card-spacing)">{events.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No upcoming calendar events.</p> : <div className="divide-y divide-border/70">{events.map((event) => <div key={event.id} className="flex gap-4 py-4 first:pt-0 last:pb-0"><div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-subtle text-primary"><CalendarDays className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{event.title}</p><Badge variant={event.type === "exam" ? "warning" : event.type === "holiday" ? "secondary" : "default"} className="capitalize">{event.type}</Badge></div><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="size-3.5" />{new Date(event.startsAt).toLocaleString()}</p>{event.description ? <p className="mt-1 text-sm text-muted-foreground">{event.description}</p> : null}</div>{canManage ? <form action={deleteAcademicEvent}><input type="hidden" name="id" value={event.id} /><Button size="xs" variant="ghost">Remove</Button></form> : null}</div>)}</div>}</CardContent></Card></div>; }
