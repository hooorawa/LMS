import { z } from "zod";

const optionalString = z.string().trim().optional().or(z.literal(""));
const optionalDateString = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date.")
  .optional()
  .or(z.literal(""));

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional().or(z.literal("")),
  employeeCode: z.string().trim().optional().or(z.literal("")),
  basicSalary: z.coerce.number().min(0, "Salary can't be negative.").optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffPermissionsSchema = z
  .object({
    dashboard: z.coerce.boolean().optional(),
    staff: z.coerce.boolean().optional(),
    students: z.coerce.boolean().optional(),
    subjects: z.coerce.boolean().optional(),
    classes: z.coerce.boolean().optional(),
    expenses: z.coerce.boolean().optional(),
    salary: z.coerce.boolean().optional(),
    income: z.coerce.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.dashboard === false) {
      ctx.addIssue({
        code: "custom",
        path: ["dashboard"],
        message: "Dashboard access is required for staff accounts.",
      });
    }
  });

export type UpdateStaffPermissionsInput = z.infer<typeof updateStaffPermissionsSchema>;

export const updateStaffSalarySchema = z.object({
  basicSalary: z.coerce.number().min(0, "Salary can't be negative."),
});

export type UpdateStaffSalaryInput = z.infer<typeof updateStaffSalarySchema>;

export const addMonthlyCommissionSchema = z.object({
  month: z.string().trim().min(1, "Month is required."),
  amount: z.coerce.number().min(0, "Amount can't be negative."),
});

export type AddMonthlyCommissionInput = z.infer<typeof addMonthlyCommissionSchema>;

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  phone: optionalString,
  rollNumber: optionalString,
  classId: optionalString,
  birthday: optionalDateString,
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")),
  guardianName: optionalString,
  guardianPhone: optionalString,
  guardianEmail: z.string().trim().email("Enter a valid guardian email.").optional().or(z.literal("")),
  guardianRelation: optionalString,
  hasSpecialNeeds: z.coerce.boolean().optional(),
  specialNeedsDetails: optionalString,
  registrationDate: optionalDateString,
  paymentType: z.enum(["cash", "card", "bank-transfer", "other"]).optional().or(z.literal("")),
  notes: optionalString,
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateStudentFormInput = z.input<typeof createStudentSchema>;

export const updateStudentRecordSchema = createStudentSchema.extend({
  status: z.enum(["active", "suspended"]),
});

export type UpdateStudentRecordInput = z.infer<typeof updateStudentRecordSchema>;
export type UpdateStudentRecordFormInput = z.input<typeof updateStudentRecordSchema>;
