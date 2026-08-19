import mongoose, { Schema, type InferSchemaType } from "mongoose";

const instituteSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    status: {
      type: String,
      enum: ["trial", "active", "past_due", "suspended", "cancelled"],
      default: "trial",
    },
    plan: { type: String, default: "free" },
    trialEndsAt: { type: Date },
    contactEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

instituteSchema.index({ status: 1, createdAt: -1 });

export type Institute = InferSchemaType<typeof instituteSchema>;

export default mongoose.models.Institute ||
  mongoose.model("Institute", instituteSchema);
