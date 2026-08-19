import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subscriptionPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, trim: true, uppercase: true, default: "USD" },
    billingInterval: { type: String, enum: ["monthly", "yearly"], required: true },
    limits: {
      maxStudents: { type: Number, default: null },
      maxStaff: { type: Number, default: null },
      maxClasses: { type: Number, default: null },
      maxSubjects: { type: Number, default: null },
      storageMb: { type: Number, default: null },
    },
    features: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

export type SubscriptionPlan = InferSchemaType<typeof subscriptionPlanSchema>;

export default mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
