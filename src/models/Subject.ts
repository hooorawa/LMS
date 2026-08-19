import mongoose, { Schema, type InferSchemaType } from "mongoose";

const subjectSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    classIds: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    teacherId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

subjectSchema.index({ instituteId: 1, code: 1 }, { unique: true });

export type Subject = InferSchemaType<typeof subjectSchema>;

export default mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
