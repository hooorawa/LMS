import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const COURSE_STATUSES = ["draft", "published", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

const courseSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classIds: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    coverImageUrl: { type: String },
    status: { type: String, enum: COURSE_STATUSES, default: "draft" },
    moduleOrder: [{ type: Schema.Types.ObjectId, ref: "Module" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

courseSchema.index({ instituteId: 1, teacherId: 1 });
courseSchema.index({ instituteId: 1, status: 1 });

export type Course = InferSchemaType<typeof courseSchema>;

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
