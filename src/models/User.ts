import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ROLES = ["super-admin", "institute-admin", "institute-staff", "student"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    notificationPreferences: {
      announcements: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
      academic: { type: Boolean, default: true },
    },
    studentMeta: {
      rollNumber: { type: String },
      classId: { type: Schema.Types.ObjectId, ref: "Class" },
      birthday: { type: Date },
      gender: { type: String, enum: ["male", "female", "other"] },
      guardianName: { type: String },
      guardianPhone: { type: String },
      guardianEmail: { type: String },
      guardianRelation: { type: String },
      hasSpecialNeeds: { type: Boolean, default: false },
      specialNeedsDetails: { type: String },
      registrationDate: { type: Date },
      paymentType: { type: String, enum: ["cash", "card", "bank-transfer", "other"] },
      notes: { type: String },
    },
    staffMeta: {
      employeeCode: { type: String },
      subjectIds: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
      basicSalary: { type: Number, default: 0 },
      commission: { type: Number, default: 0 },
      monthlyCommissions: [
        {
          month: { type: String },
          amount: { type: Number, default: 0 },
          recordedAt: { type: Date, default: Date.now },
        },
      ],
      permissions: {
        dashboard: { type: Boolean, default: true },
        staff: { type: Boolean, default: false },
        students: { type: Boolean, default: false },
        subjects: { type: Boolean, default: false },
        classes: { type: Boolean, default: false },
        expenses: { type: Boolean, default: false },
        salary: { type: Boolean, default: false },
        income: { type: Boolean, default: false },
      },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

userSchema.index({ instituteId: 1, role: 1 });

export type User = InferSchemaType<typeof userSchema>;

export default mongoose.models.User || mongoose.model("User", userSchema);
