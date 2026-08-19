import { notFound } from "next/navigation";
import Link from "next/link";
import { getActiveSession } from "@/lib/data/class-session.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionControls } from "./session-controls";

export default async function ClassSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getActiveSession(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {data.class.name}
          {data.class.section ? ` ${data.class.section}` : ""} — live session
        </h1>
        <Link href="/attendance" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to attendance
        </Link>
      </div>

      <SessionControls
        classId={id}
        sessionStatus={data.class.sessionStatus}
        breakStatus={data.class.breakStatus}
        totalBreakDuration={data.class.totalBreakDuration}
        roster={data.roster}
      />
    </div>
  );
}
