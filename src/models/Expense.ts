import mongoose, { Schema, type InferSchemaType } from "mongoose";

const expenseSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    year: { type: String, required: true, trim: true },
    month: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

expenseSchema.index({ instituteId: 1, year: 1, month: 1 });

export type Expense = InferSchemaType<typeof expenseSchema>;

export default mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
