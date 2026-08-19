"use server";

import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import SubscriptionModel from "@/models/Subscription";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
} from "@/lib/validation/subscription-plan.schema";
import {
  assignPlanSchema,
  suspendInstituteSchema,
  reactivateInstituteSchema,
  cancelInstituteSchema,
} from "@/lib/validation/subscription.schema";

function parseFeatures(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function nullableNumber(raw: FormDataEntryValue | null): number | null | undefined {
  if (raw === null || raw === "") return null;
  return Number(raw);
}

export type PlanFormState = {
  error?: string;
  success?: boolean;
  planId?: string;
};

export async function createPlan(
  _prevState: PlanFormState,
  formData: FormData
): Promise<PlanFormState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = createSubscriptionPlanSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    billingInterval: formData.get("billingInterval"),
    limits: {
      maxStudents: nullableNumber(formData.get("maxStudents")),
      maxStaff: nullableNumber(formData.get("maxStaff")),
      maxClasses: nullableNumber(formData.get("maxClasses")),
      maxSubjects: nullableNumber(formData.get("maxSubjects")),
      storageMb: nullableNumber(formData.get("storageMb")),
    },
    features: parseFeatures(formData.get("features")),
    isActive: formData.get("isActive") === "on",
    isPublic: formData.get("isPublic") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const existingSlug = await SubscriptionPlanModel.findOne({ slug: parsed.data.slug });
  if (existingSlug) {
    return { error: `Slug "${parsed.data.slug}" is already in use.` };
  }

  const plan = await SubscriptionPlanModel.create({
    ...parsed.data,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subscriptionPlan.create",
    targetType: "SubscriptionPlan",
    targetId: plan._id.toString(),
    targetName: plan.name,
    summary: `Created plan "${plan.name}" (${plan.slug})`,
    after: { name: plan.name, slug: plan.slug, price: plan.price, billingInterval: plan.billingInterval },
  });

  return { success: true, planId: plan._id.toString() };
}

export async function updatePlan(
  _prevState: PlanFormState,
  formData: FormData
): Promise<PlanFormState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = updateSubscriptionPlanSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    billingInterval: formData.get("billingInterval"),
    limits: {
      maxStudents: nullableNumber(formData.get("maxStudents")),
      maxStaff: nullableNumber(formData.get("maxStaff")),
      maxClasses: nullableNumber(formData.get("maxClasses")),
      maxSubjects: nullableNumber(formData.get("maxSubjects")),
      storageMb: nullableNumber(formData.get("storageMb")),
    },
    features: parseFeatures(formData.get("features")),
    isActive: formData.get("isActive") === "on",
    isPublic: formData.get("isPublic") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const { id, ...updates } = parsed.data;
  const plan = await SubscriptionPlanModel.findById(id);
  if (!plan) {
    return { error: "Plan not found." };
  }

  if (updates.slug && updates.slug !== plan.slug) {
    const existingSlug = await SubscriptionPlanModel.findOne({ slug: updates.slug, _id: { $ne: id } });
    if (existingSlug) {
      return { error: `Slug "${updates.slug}" is already in use.` };
    }
  }

  const before = plan.toObject();
  Object.assign(plan, updates);
  await plan.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subscriptionPlan.update",
    targetType: "SubscriptionPlan",
    targetId: plan._id.toString(),
    targetName: plan.name,
    summary: `Updated plan "${plan.name}" (${plan.slug})`,
    before: { name: before.name, price: before.price, isActive: before.isActive },
    after: { name: plan.name, price: plan.price, isActive: plan.isActive },
  });

  return { success: true, planId: plan._id.toString() };
}

export type AssignPlanState = {
  error?: string;
  success?: boolean;
};

// Intentionally does not mirror Institute.status: switching plans is
// independent of the suspend/active/cancelled lifecycle, which is only
// driven by suspendInstitute/reactivateInstitute/cancelInstitute and the
// trial-expiry sweep in lifecycle.ts.
export async function assignPlan(
  _prevState: AssignPlanState,
  formData: FormData
): Promise<AssignPlanState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = assignPlanSchema.safeParse({
    instituteId: formData.get("instituteId"),
    planId: formData.get("planId"),
    currentPeriodStart: formData.get("currentPeriodStart") || undefined,
    currentPeriodEnd: formData.get("currentPeriodEnd") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { instituteId, planId, currentPeriodStart, currentPeriodEnd } = parsed.data;

  await connectToDatabase();

  const [institute, plan] = await Promise.all([
    InstituteModel.findById(instituteId),
    SubscriptionPlanModel.findById(planId),
  ]);

  if (!institute) {
    return { error: "Institute not found." };
  }
  if (!plan) {
    return { error: "Plan not found." };
  }

  let subscription = await SubscriptionModel.findOne({ instituteId });
  const before = subscription ? { planId: subscription.planId?.toString() } : null;

  if (!subscription) {
    subscription = await SubscriptionModel.create({
      instituteId,
      planId,
      status: "trialing",
      currentPeriodStart: currentPeriodStart ?? null,
      currentPeriodEnd: currentPeriodEnd ?? null,
      createdBy: session.userId,
    });
  } else {
    subscription.planId = plan._id;
    if (currentPeriodStart) subscription.currentPeriodStart = currentPeriodStart;
    if (currentPeriodEnd) subscription.currentPeriodEnd = currentPeriodEnd;
    await subscription.save();
  }

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subscription.assignPlan",
    targetType: "Institute",
    targetId: institute._id.toString(),
    targetName: institute.name,
    instituteId: institute._id.toString(),
    summary: `Assigned plan "${plan.name}" to institute "${institute.name}"`,
    before,
    after: { planId: plan._id.toString(), planName: plan.name },
  });

  return { success: true };
}

export type LifecycleActionState = {
  error?: string;
  success?: boolean;
};

export async function suspendInstitute(
  _prevState: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = suspendInstituteSchema.safeParse({
    instituteId: formData.get("instituteId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { instituteId, reason } = parsed.data;

  await connectToDatabase();

  const [institute, subscription] = await Promise.all([
    InstituteModel.findById(instituteId),
    SubscriptionModel.findOne({ instituteId }),
  ]);

  if (!institute) {
    return { error: "Institute not found." };
  }
  if (!subscription) {
    return { error: "This institute has no subscription to suspend." };
  }
  if (subscription.status === "cancelled") {
    return { error: "This institute's subscription is cancelled and cannot be suspended." };
  }

  const beforeStatus = subscription.status;

  subscription.status = "suspended";
  subscription.suspendedAt = new Date();
  subscription.suspendReason = reason;
  await subscription.save();

  institute.status = "suspended";
  await institute.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subscription.suspend",
    targetType: "Institute",
    targetId: institute._id.toString(),
    targetName: institute.name,
    instituteId: institute._id.toString(),
    summary: `Suspended institute "${institute.name}": ${reason}`,
    before: { status: beforeStatus },
    after: { status: "suspended", reason },
  });

  return { success: true };
}

export async function reactivateInstitute(
  _prevState: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = reactivateInstituteSchema.safeParse({
    instituteId: formData.get("instituteId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { instituteId } = parsed.data;

  await connectToDatabase();

  const [institute, subscription] = await Promise.all([
    InstituteModel.findById(instituteId),
    SubscriptionModel.findOne({ instituteId }),
  ]);

  if (!institute) {
    return { error: "Institute not found." };
  }
  if (!subscription) {
    return { error: "This institute has no subscription to reactivate." };
  }
  if (subscription.status === "cancelled") {
    return { error: "This institute's subscription is cancelled and cannot be reactivated." };
  }

  const beforeStatus = subscription.status;

  subscription.status = "active";
  subscription.suspendedAt = null;
  subscription.suspendReason = undefined;
  await subscription.save();

  institute.status = "active";
  await institute.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subscription.reactivate",
    targetType: "Institute",
    targetId: institute._id.toString(),
    targetName: institute.name,
    instituteId: institute._id.toString(),
    summary: `Reactivated institute "${institute.name}"`,
    before: { status: beforeStatus },
    after: { status: "active" },
  });

  return { success: true };
}

export async function cancelInstitute(
  _prevState: LifecycleActionState,
  formData: FormData
): Promise<LifecycleActionState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = cancelInstituteSchema.safeParse({
    instituteId: formData.get("instituteId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { instituteId, reason } = parsed.data;

  await connectToDatabase();

  const [institute, subscription] = await Promise.all([
    InstituteModel.findById(instituteId),
    SubscriptionModel.findOne({ instituteId }),
  ]);

  if (!institute) {
    return { error: "Institute not found." };
  }
  if (!subscription) {
    return { error: "This institute has no subscription to cancel." };
  }
  if (subscription.status === "cancelled") {
    return { error: "This institute's subscription is already cancelled." };
  }

  const beforeStatus = subscription.status;

  subscription.status = "cancelled";
  subscription.cancelledAt = new Date();
  subscription.cancelReason = reason;
  subscription.autoRenew = false;
  await subscription.save();

  institute.status = "cancelled";
  await institute.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subscription.cancel",
    targetType: "Institute",
    targetId: institute._id.toString(),
    targetName: institute.name,
    instituteId: institute._id.toString(),
    summary: `Cancelled institute "${institute.name}": ${reason}`,
    before: { status: beforeStatus },
    after: { status: "cancelled", reason },
  });

  return { success: true };
}
