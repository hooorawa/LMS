import { config } from "dotenv";
config({ path: ".env.local" });

import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import SubscriptionPlanModel from "@/models/SubscriptionPlan";
import SubscriptionModel from "@/models/Subscription";

const FREE_TRIAL_SLUG = "free-trial";

const INSTITUTE_STATUS_TO_SUBSCRIPTION_STATUS: Record<string, string> = {
  trial: "trialing",
  active: "active",
  past_due: "past_due",
  suspended: "suspended",
  cancelled: "cancelled",
};

async function getOrCreateFreeTrialPlan() {
  const existing = await SubscriptionPlanModel.findOne({ slug: FREE_TRIAL_SLUG });
  if (existing) {
    return existing;
  }

  return SubscriptionPlanModel.create({
    name: "Free Trial",
    slug: FREE_TRIAL_SLUG,
    description: "Default plan backfilled for institutes created before the subscription system.",
    price: 0,
    currency: "USD",
    billingInterval: "monthly",
    limits: {
      maxStudents: null,
      maxStaff: null,
      maxClasses: null,
      maxSubjects: null,
      storageMb: null,
    },
    features: [],
    isActive: true,
    isPublic: false,
    sortOrder: 0,
  });
}

async function main() {
  await connectToDatabase();

  const freeTrialPlan = await getOrCreateFreeTrialPlan();

  const institutes = await InstituteModel.find({});
  let created = 0;
  let skipped = 0;

  for (const institute of institutes) {
    const existingSubscription = await SubscriptionModel.findOne({ instituteId: institute._id });
    if (existingSubscription) {
      skipped += 1;
      continue;
    }

    const status = INSTITUTE_STATUS_TO_SUBSCRIPTION_STATUS[institute.status] ?? "trialing";

    await SubscriptionModel.create({
      instituteId: institute._id,
      planId: freeTrialPlan._id,
      status,
      trialEndsAt: institute.trialEndsAt ?? null,
      currentPeriodStart: status === "active" ? institute.createdAt : null,
      currentPeriodEnd: null,
      autoRenew: true,
      cancelledAt: status === "cancelled" ? new Date() : null,
      suspendedAt: status === "suspended" ? new Date() : null,
    });
    created += 1;
  }

  console.log(`Backfill complete. Created ${created} subscription(s), skipped ${skipped} already backfilled.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
