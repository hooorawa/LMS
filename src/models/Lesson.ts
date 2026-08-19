import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const LESSON_TYPES = ["video", "pdf", "text", "link"] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

const lessonSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: LESSON_TYPES, required: true },
    // For video/pdf this holds the S3 object key (not a public URL) — signed read
    // URLs are minted on demand so enrollment can be checked before content is served.
    // For link this holds the external URL directly.
    contentUrl: { type: String },
    textBody: { type: String },
    durationSeconds: { type: Number },
    order: { type: Number, required: true, default: 0 },
    isPreview: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

lessonSchema.index({ moduleId: 1, order: 1 });
lessonSchema.index({ courseId: 1 });

export type Lesson = InferSchemaType<typeof lessonSchema>;

export default mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);
