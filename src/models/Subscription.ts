import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subscriptionSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true, unique: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "suspended", "cancelled"],
      default: "trialing",
    },
    trialEndsAt: { type: Date },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    autoRenew: { type: Boolean, default: true },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, trim: true },
    suspendedAt: { type: Date, default: null },
    suspendReason: { type: String, trim: true },
    lastTrialReminderAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, trialEndsAt: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

export type Subscription = InferSchemaType<typeof subscriptionSchema>;

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
