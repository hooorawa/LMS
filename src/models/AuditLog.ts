import mongoose, { Schema, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId },
    targetName: { type: String },
    summary: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    changedFields: [{ type: String }],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ instituteId: 1, createdAt: -1 });

export type AuditLog = InferSchemaType<typeof auditLogSchema>;

export default mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
