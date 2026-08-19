import mongoose, { Schema, type InferSchemaType } from "mongoose";

const extraIncomeSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true },
    year: { type: String, required: true, trim: true },
    month: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

extraIncomeSchema.index({ instituteId: 1, year: 1, month: 1 });

export type ExtraIncome = InferSchemaType<typeof extraIncomeSchema>;

export default mongoose.models.ExtraIncome || mongoose.model("ExtraIncome", extraIncomeSchema);
