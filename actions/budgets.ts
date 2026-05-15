// actions/budgets.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getBudgetSuggestion } from "@/lib/ai";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const budgetSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  categoryId: z.string().optional(),
});

// ─── Read ─────────────────────────────────────────────────────────────────────
export async function getBudgets(month: number, year: number) {
  const userId = await requireUser();

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  // For each budget, calculate how much has been spent
  // We do this in JS after fetching rather than a complex SQL join
  // At this scale it's fine — revisit if user has 100+ budgets
  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const startDate = new Date(year, month - 1, 1); // first day of month
      const endDate = new Date(year, month, 0); // last day of month
      // new Date(year, month, 0) is a JS trick: day 0 = last day of previous month

      const spending = await prisma.expense.aggregate({
        where: {
          userId,
          deletedAt: null,
          date: { gte: startDate, lte: endDate },
          // If budget has a category, filter by it
          // If no category (overall budget), get all uncategorized expenses
          categoryId: budget.categoryId ?? null,
        },
        _sum: { amount: true },
      });

      const spent = Number(spending._sum.amount ?? 0);
      const total = Number(budget.amount);
      const percentage = total > 0 ? Math.round((spent / total) * 100) : 0;

      return {
        ...budget,
        amount: total, // serialize Decimal → number
        spent,
        remaining: total - spent,
        percentage,
        isOverBudget: spent > total,
      };
    })
  );

  return budgetsWithSpending;
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createBudget(formData: FormData) {
  const userId = await requireUser();

  const raw = {
    amount: formData.get("amount"),
    month: formData.get("month"),
    year: formData.get("year"),
    categoryId: formData.get("categoryId") || undefined,
  };

  const result = budgetSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { amount, month, year, categoryId } = result.data;

  // Check for duplicate — one budget per category per month per user
  // findFirst is used instead of findUnique because Prisma rejects null in compound unique keys
  const existing = await prisma.budget.findFirst({
    where: { userId, categoryId: categoryId ?? null, month, year },
  });

  if (existing) {
    return { error: "A budget for this category and month already exists" };
  }

  await prisma.budget.create({
    data: { userId, amount, month, year, categoryId: categoryId ?? null },
  });

  revalidatePath("/budgets");
  return { success: true };
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function updateBudget(id: string, formData: FormData) {
  const userId = await requireUser();

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) {
    return { error: "Budget not found" };
  }

  const raw = {
    amount: formData.get("amount"),
    month: formData.get("month"),
    year: formData.get("year"),
    categoryId: formData.get("categoryId") || undefined,
  };

  const result = budgetSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await prisma.budget.update({
    where: { id },
    data: { amount: result.data.amount },
    // Note: we only allow updating amount, not month/year/category
    // Changing those would require duplicate checks again
  });

  revalidatePath("/budgets");
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function deleteBudget(id: string) {
  const userId = await requireUser();

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) {
    return { error: "Budget not found" };
  }

  await prisma.budget.delete({ where: { id } });

  revalidatePath("/budgets");
  return { success: true };
}

// ─── AI Suggestion ────────────────────────────────────────────────────────────
export async function getAISuggestion(
  categoryId: string | null,
  month: number,
  year: number
) {
  const userId = await requireUser();

  // Get last 3 months of spending for this category
  const historicalData = [];

  for (let i = 1; i <= 3; i++) {
    // Go back i months from selected month/year
    const date = new Date(year, month - 1 - i, 1);
    const m = date.getMonth() + 1;
    const y = date.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    const result = await prisma.expense.aggregate({
      where: {
        userId,
        deletedAt: null,
        categoryId: categoryId ?? null,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const total = Number(result._sum.amount ?? 0);

    // Only include months that had actual spending
    if (total > 0) {
      historicalData.push({
        month: date.toLocaleString("en-IN", { month: "long", year: "numeric" }),
        total,
      });
    }
  }

  // Need at least 2 months of data for a meaningful suggestion
  if (historicalData.length < 2) {
    return {
      error: "Not enough history. Add expenses for at least 2 months first.",
    };
  }

  // Get category name for the prompt
  let categoryName = "Overall";
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    categoryName = cat?.name ?? "Unknown";
  }

  const suggestion = await getBudgetSuggestion(categoryName, historicalData);

  if (!suggestion) {
    return { error: "AI suggestion failed. Try again." };
  }

  return { success: true, suggestion };
}
