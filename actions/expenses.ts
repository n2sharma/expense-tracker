// actions/expenses.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExpenseType, RecurringFrequency } from "@/app/generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────
// Exported so components can import and use it for type safety
export interface ExpenseFilters {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
}

const ITEMS_PER_PAGE = 10;

// ─── Helper ───────────────────────────────────────────────────────────────────
async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ─── Validation Schema ────────────────────────────────────────────────────────
const expenseSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100),
    amount: z.coerce
      .number({ invalid_type_error: "Amount must be a number" })
      .positive("Amount must be positive"),
    // coerce.number() converts the string "49.99" from FormData into an actual number
    date: z.string().min(1, "Date is required"),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    type: z.nativeEnum(ExpenseType),
    recurringFrequency: z.nativeEnum(RecurringFrequency).optional(),
    recurringStartDate: z.string().optional(),
    recurringEndDate: z.string().optional(),
  })
  // Refinement: if type is RECURRING, frequency and start date become required
  .refine(
    (data) => {
      if (data.type === "RECURRING") {
        return !!data.recurringFrequency && !!data.recurringStartDate;
      }
      return true;
    },
    {
      message: "Recurring expenses need a frequency and start date",
      path: ["recurringFrequency"],
    }
  );

// ─── Read ─────────────────────────────────────────────────────────────────────
export async function getExpenses(filters: ExpenseFilters = {}) {
  const userId = await requireUser();

  const { categoryId, startDate, endDate, search, page = 1 } = filters;

  // Build the where clause dynamically
  // Only add conditions that actually have values
  const where: Record<string, unknown> = {
    userId,
    deletedAt: null, // soft delete — never show deleted expenses
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (startDate || endDate) {
    where.date = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // Run both queries in parallel — total count for pagination + actual page data
  // Promise.all means they run simultaneously, not one after the other
  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
  ]);

  return {
    expenses: expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
    total,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    currentPage: page,
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createExpense(formData: FormData) {
  const userId = await requireUser();

  const raw = {
    title: formData.get("title"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    recurringFrequency: formData.get("recurringFrequency") || undefined,
    recurringStartDate: formData.get("recurringStartDate") || undefined,
    recurringEndDate: formData.get("recurringEndDate") || undefined,
  };

  const result = expenseSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const data = result.data;

  await prisma.expense.create({
    data: {
      userId,
      title: data.title,
      amount: data.amount,
      date: new Date(data.date),
      categoryId: data.categoryId || null,
      description: data.description || null,
      type: data.type,
      // Only set recurring fields if type is RECURRING, otherwise null
      recurringFrequency:
        data.type === "RECURRING" ? data.recurringFrequency ?? null : null,
      recurringStartDate:
        data.type === "RECURRING" && data.recurringStartDate
          ? new Date(data.recurringStartDate)
          : null,
      recurringEndDate:
        data.type === "RECURRING" && data.recurringEndDate
          ? new Date(data.recurringEndDate)
          : null,
    },
  });

  revalidatePath("/expenses");
  return { success: true };
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateExpense(id: string, formData: FormData) {
  const userId = await requireUser();

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.userId !== userId) {
    return { error: "Expense not found" };
  }

  const raw = {
    title: formData.get("title"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    recurringFrequency: formData.get("recurringFrequency") || undefined,
    recurringStartDate: formData.get("recurringStartDate") || undefined,
    recurringEndDate: formData.get("recurringEndDate") || undefined,
  };

  const result = expenseSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const data = result.data;

  await prisma.expense.update({
    where: { id },
    data: {
      title: data.title,
      amount: data.amount,
      date: new Date(data.date),
      categoryId: data.categoryId || null,
      description: data.description || null,
      type: data.type,
      recurringFrequency:
        data.type === "RECURRING" ? data.recurringFrequency ?? null : null,
      recurringStartDate:
        data.type === "RECURRING" && data.recurringStartDate
          ? new Date(data.recurringStartDate)
          : null,
      recurringEndDate:
        data.type === "RECURRING" && data.recurringEndDate
          ? new Date(data.recurringEndDate)
          : null,
    },
  });

  revalidatePath("/expenses");
  return { success: true };
}

// ─── Soft Delete ──────────────────────────────────────────────────────────────
// We do NOT hard delete expenses — they affect budget calculations
// Setting deletedAt hides them from queries but preserves history
export async function deleteExpense(id: string) {
  const userId = await requireUser();

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.userId !== userId) {
    return { error: "Expense not found" };
  }

  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/expenses");
  return { success: true };
}
