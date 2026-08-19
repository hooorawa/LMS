import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ANNOUNCEMENT_AUDIENCES = ["institute", "class", "course"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

const announcementSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    classId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: { type: String, enum: ANNOUNCEMENT_AUDIENCES, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

announcementSchema.index({ instituteId: 1, publishedAt: -1 });
announcementSchema.index({ courseId: 1, publishedAt: -1 });
announcementSchema.index({ classId: 1, publishedAt: -1 });

export type Announcement = InferSchemaType<typeof announcementSchema>;

export default mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
