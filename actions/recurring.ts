// actions/recurring.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ─── Read ─────────────────────────────────────────────────────────────────────
// Gets all parent recurring expenses (not the auto-generated children)
export async function getRecurringExpenses() {
  const userId = await requireUser();

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      type: "RECURRING",
      parentExpenseId: null, // only parent records, not generated children
      deletedAt: null,
    },
    include: {
      category: true,
      // Count how many entries have been auto-generated from this parent
      _count: { select: { childExpenses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return expenses.map((e) => ({
    ...e,
    amount: Number(e.amount), // serialize Decimal
  }));
}

// ─── Stop Recurring ───────────────────────────────────────────────────────────
// Instead of deleting, we set an end date = today
// This preserves history and stops future generation
export async function stopRecurring(id: string) {
  const userId = await requireUser();

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.userId !== userId) {
    return { error: "Expense not found" };
  }

  await prisma.expense.update({
    where: { id },
    data: { recurringEndDate: new Date() },
  });

  revalidatePath("/recurring");
  return { success: true };
}

// ─── Delete Recurring + All Children ─────────────────────────────────────────
export async function deleteRecurring(id: string) {
  const userId = await requireUser();

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || expense.userId !== userId) {
    return { error: "Expense not found" };
  }

  // Delete children first (foreign key constraint)
  await prisma.expense.updateMany({
    where: { parentExpenseId: id },
    data: { deletedAt: new Date() },
  });

  // Then soft delete the parent
  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/recurring");
  return { success: true };
}
