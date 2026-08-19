import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AuditLogModel from "@/models/AuditLog";
import { requireSession, requireRole } from "@/lib/tenant/scope";

export type AuditLogFilters = {
  instituteId?: string;
  actorRole?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function listAuditLogs(filters: AuditLogFilters = {}, page = 1, pageSize = 25) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (filters.instituteId) query.instituteId = filters.instituteId;
  if (filters.actorRole) query.actorRole = filters.actorRole;
  if (filters.action) query.action = filters.action;
  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) createdAt.$lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    query.createdAt = createdAt;
  }

  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [logs, total] = await Promise.all([
    AuditLogModel.find(query)
      .populate("instituteId", "name code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    AuditLogModel.countDocuments(query),
  ]);

  return { logs, total, page: safePage, pageSize };
}

export async function listDistinctAuditActions(): Promise<string[]> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();
  const actions = await AuditLogModel.distinct("action");
  return actions.sort();
}

export async function getAuditLogOverview(filters: AuditLogFilters = {}) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (filters.instituteId) query.instituteId = filters.instituteId;
  if (filters.actorRole) query.actorRole = filters.actorRole;
  if (filters.action) query.action = filters.action;
  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) createdAt.$lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    query.createdAt = createdAt;
  }

  const [overview] = await AuditLogModel.aggregate<{
    entries: number;
    platformEvents: number;
    systemEvents: number;
    uniqueActors: number;
  }>([
    { $match: query },
    {
      $group: {
        _id: null,
        entries: { $sum: 1 },
        platformEvents: { $sum: { $cond: [{ $eq: ["$instituteId", null] }, 1, 0] } },
        systemEvents: { $sum: { $cond: [{ $eq: ["$actorRole", "system"] }, 1, 0] } },
        actors: { $addToSet: "$actorUserId" },
      },
    },
    { $project: { _id: 0, entries: 1, platformEvents: 1, systemEvents: 1, uniqueActors: { $size: "$actors" } } },
  ]);

  return overview ?? { entries: 0, platformEvents: 0, systemEvents: 0, uniqueActors: 0 };
}
