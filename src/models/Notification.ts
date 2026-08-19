import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const NOTIFICATION_TYPES = ["announcement", "academic", "billing", "trial"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const notificationSchema = new Schema(
  {
    // Null is reserved for platform-wide notifications, unused until super-admin needs it.
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export type Notification = InferSchemaType<typeof notificationSchema>;

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
