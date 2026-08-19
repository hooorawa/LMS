import mongoose, { Schema, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    feeId: { type: Schema.Types.ObjectId, ref: "Fee", default: null },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank-transfer", "card", "cheque", "other"],
      required: true,
    },
    paymentDate: { type: Date, required: true },
    receiptNumber: { type: String, required: true, unique: true, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentSchema.index({ instituteId: 1, studentId: 1 });

export type Payment = InferSchemaType<typeof paymentSchema>;

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
