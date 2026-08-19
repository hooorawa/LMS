import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AuditLogModel from "@/models/AuditLog";
import type { SessionPayload } from "@/lib/auth/session";

type RecordAuditEntryInput = {
  session: SessionPayload;
  actorName: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  changedFields?: string[];
  metadata?: Record<string, unknown>;
  instituteId?: string | null;
};

export async function recordAuditEntry(input: RecordAuditEntryInput): Promise<void> {
  await connectToDatabase();

  await AuditLogModel.create({
    instituteId: input.instituteId ?? input.session.instituteId,
    actorUserId: input.session.userId,
    actorName: input.actorName,
    actorRole: input.session.role,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetName: input.targetName,
    summary: input.summary,
    before: input.before,
    after: input.after,
    changedFields: input.changedFields,
    metadata: input.metadata,
  });
}
