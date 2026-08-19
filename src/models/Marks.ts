import mongoose, { Schema, type InferSchemaType } from "mongoose";

const marksSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    marksObtained: { type: Number, required: true },
    grade: { type: String, trim: true },
    remarks: { type: String, trim: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// One flattened doc per exam+student — upserted on re-entry.
marksSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export type Marks = InferSchemaType<typeof marksSchema>;

export default mongoose.models.Marks || mongoose.model("Marks", marksSchema);
