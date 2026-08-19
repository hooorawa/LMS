import { notFound } from "next/navigation";
import { getSessionStatusForStudent } from "@/lib/data/class-session.data";
import { JoinControls } from "./join-controls";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

export default async function ClassJoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSessionStatusForStudent(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <StudentWorkspaceHeader
        eyebrow="Live classroom"
        title={`${data.class.name}${data.class.section ? ` ${data.class.section}` : ""}`}
        description="Join your scheduled live class when the session opens, and return here whenever you need the classroom link."
        metrics={[{ label: "Session status", value: data.class.sessionStatus === "active" ? "Live" : "Soon", detail: data.class.sessionStatus === "active" ? "Your class is currently live" : "Waiting for your teacher", tone: data.class.sessionStatus === "active" ? "success" : "info" }]}
      />

      <JoinControls
        classId={id}
        sessionStatus={data.class.sessionStatus}
        attempt={data.attempt}
      />
    </div>
  );
}
