import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const SUBMISSION_STATUSES = ["submitted", "graded"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

const submissionSchema = new Schema(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    textResponse: { type: String, trim: true },
    // S3 object key, signed on read — mirrors Lesson.contentUrl convention.
    attachmentKey: { type: String },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: SUBMISSION_STATUSES, default: "submitted" },
    grade: {
      score: { type: Number },
      feedback: { type: String, trim: true },
      gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
      gradedAt: { type: Date },
    },
  },
  { timestamps: true }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ courseId: 1, status: 1 });

export type Submission = InferSchemaType<typeof submissionSchema>;

export default mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
