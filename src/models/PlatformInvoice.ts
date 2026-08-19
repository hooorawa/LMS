import mongoose, { Schema, type InferSchemaType } from "mongoose";

const platformInvoiceSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    planNameSnapshot: { type: String, required: true, trim: true },
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, trim: true, uppercase: true, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "void"],
      default: "pending",
    },
    issuedAt: { type: Date, required: true },
    dueAt: { type: Date, required: true },
    paidAt: { type: Date, default: null },
    paymentMethod: {
      type: String,
      enum: ["bank-transfer", "cash", "cheque", "card-manual", "other"],
    },
    receiptNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    discountAmount: { type: Number, default: 0 },
    discountReason: { type: String, trim: true },
    lastOverdueReminderAt: { type: Date, default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

platformInvoiceSchema.index({ status: 1, dueAt: 1 });
platformInvoiceSchema.index({ instituteId: 1, createdAt: -1 });

export type PlatformInvoice = InferSchemaType<typeof platformInvoiceSchema>;

export default mongoose.models.PlatformInvoice ||
  mongoose.model("PlatformInvoice", platformInvoiceSchema);
