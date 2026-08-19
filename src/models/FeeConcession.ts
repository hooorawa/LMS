import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const FEE_CONCESSION_TYPES = ["fixed", "percent"] as const;

const feeConcessionSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    feeId: { type: Schema.Types.ObjectId, ref: "Fee", default: null },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: FEE_CONCESSION_TYPES, required: true },
    value: { type: Number, required: true },
    reason: { type: String, trim: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

feeConcessionSchema.index({ instituteId: 1, studentId: 1 });
feeConcessionSchema.index({ instituteId: 1, feeId: 1 });

export type FeeConcession = InferSchemaType<typeof feeConcessionSchema>;

export default mongoose.models.FeeConcession ||
  mongoose.model("FeeConcession", feeConcessionSchema);
