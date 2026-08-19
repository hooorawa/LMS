"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import ExpenseModel from "@/models/Expense";
import ExtraIncomeModel from "@/models/ExtraIncome";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createExpenseSchema, createExtraIncomeSchema } from "@/lib/validation/finance.schema";

export type CreateExpenseState = {
  error?: string;
  success?: { expenseId: string; type: string };
};

export async function createExpense(
  _prevState: CreateExpenseState,
  formData: FormData
): Promise<CreateExpenseState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createExpenseSchema.safeParse({
    year: formData.get("year"),
    month: formData.get("month"),
    type: formData.get("type"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { year, month, type, price } = parsed.data;

  await connectToDatabase();

  const expense = await ExpenseModel.create({
    instituteId: session.instituteId,
    year,
    month,
    type,
    price,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "expense.create",
    targetType: "Expense",
    targetId: expense._id.toString(),
    targetName: expense.type,
    summary: `Recorded expense "${expense.type}" (${month} ${year}) of ${expense.price}`,
    after: { type: expense.type, price: expense.price, year, month },
  });

  revalidatePath("/expenses");

  return { success: { expenseId: expense._id.toString(), type: expense.type } };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const expense = await ExpenseModel.findOne(withTenantScope({ _id: id }, session));
  if (!expense) return;

  await ExpenseModel.deleteOne({ _id: expense._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "expense.delete",
    targetType: "Expense",
    targetId: expense._id.toString(),
    targetName: expense.type,
    summary: `Deleted expense "${expense.type}" (${expense.month} ${expense.year})`,
    before: { type: expense.type, price: expense.price },
  });

  revalidatePath("/expenses");
}

export type CreateExtraIncomeState = {
  error?: string;
  success?: { incomeId: string; title: string };
};

export async function createExtraIncome(
  _prevState: CreateExtraIncomeState,
  formData: FormData
): Promise<CreateExtraIncomeState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createExtraIncomeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    year: formData.get("year"),
    month: formData.get("month"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { title, description, amount, year, month } = parsed.data;

  await connectToDatabase();

  const income = await ExtraIncomeModel.create({
    instituteId: session.instituteId,
    title,
    description: description || undefined,
    amount,
    year,
    month,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "extra-income.create",
    targetType: "ExtraIncome",
    targetId: income._id.toString(),
    targetName: income.title,
    summary: `Recorded extra income "${income.title}" (${month} ${year}) of ${income.amount}`,
    after: { title: income.title, amount: income.amount, year, month },
  });

  revalidatePath("/income");

  return { success: { incomeId: income._id.toString(), title: income.title } };
}

export async function deleteExtraIncome(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const income = await ExtraIncomeModel.findOne(withTenantScope({ _id: id }, session));
  if (!income) return;

  await ExtraIncomeModel.deleteOne({ _id: income._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "extra-income.delete",
    targetType: "ExtraIncome",
    targetId: income._id.toString(),
    targetName: income.title,
    summary: `Deleted extra income "${income.title}" (${income.month} ${income.year})`,
    before: { title: income.title, amount: income.amount },
  });

  revalidatePath("/income");
}
