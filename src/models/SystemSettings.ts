import mongoose, { Schema, type InferSchemaType } from "mongoose";

const systemSettingsSchema = new Schema(
  {
    systemName: { type: String, required: true, trim: true, default: "LearningMS" },
    tagline: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    supportEmail: { type: String, trim: true, lowercase: true },
    defaultTrialDays: { type: Number, default: 14 },
    primaryColor: { type: String, trim: true },
    privacyPolicy: { type: String },
    termsOfUse: { type: String },
    helpCenterContent: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type SystemSettings = InferSchemaType<typeof systemSettingsSchema>;

export default mongoose.models.SystemSettings ||
  mongoose.model("SystemSettings", systemSettingsSchema);
