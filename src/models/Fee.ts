import mongoose, { Schema, type InferSchemaType } from "mongoose";

const feeSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    studentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    academicYear: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ["one-time", "monthly", "term"], default: "one-time" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

feeSchema.index({ instituteId: 1, academicYear: 1 });
feeSchema.index({ instituteId: 1, classId: 1 });
feeSchema.index({ instituteId: 1, studentId: 1 });

export type Fee = InferSchemaType<typeof feeSchema>;

export default mongoose.models.Fee || mongoose.model("Fee", feeSchema);
