// actions/categories.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Validation Schema ───────────────────────────────────────────────────────
// Defined once, reused for both create and update
const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  icon: z.string().optional(),
});

// ─── Helper ──────────────────────────────────────────────────────────────────
// DRY: both actions need to get the session and throw if not authed
async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ─── Create ──────────────────────────────────────────────────────────────────
export async function createCategory(formData: FormData) {
  const userId = await requireUser();

  const raw = {
    name: formData.get("name"),
    color: formData.get("color") || "#3B82F6",
    icon: formData.get("icon") || undefined,
  };

  const result = categorySchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // Check for duplicate name (unique per user, not globally)
  const existing = await prisma.category.findUnique({
    where: {
      name_userId: { name: result.data.name, userId },
    },
  });
  if (existing) {
    return { error: "You already have a category with this name" };
  }

  await prisma.category.create({
    data: { ...result.data, userId },
  });

  // This is the key line — tells Next.js to re-fetch this page's data
  revalidatePath("/dashboard/categories");
  return { success: true };
}

// ─── Update ──────────────────────────────────────────────────────────────────
export async function updateCategory(id: string, formData: FormData) {
  const userId = await requireUser();

  const raw = {
    name: formData.get("name"),
    color: formData.get("color") || "#3B82F6",
    icon: formData.get("icon") || undefined,
  };

  const result = categorySchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // Ownership check — CRITICAL: user can only edit their own categories
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.userId !== userId) {
    return { error: "Category not found" };
  }

  // Duplicate name check (excluding current record)
  const duplicate = await prisma.category.findFirst({
    where: {
      name: result.data.name,
      userId,
      NOT: { id }, // exclude self
    },
  });
  if (duplicate) {
    return { error: "You already have a category with this name" };
  }

  await prisma.category.update({
    where: { id },
    data: result.data,
  });

  revalidatePath("/dashboard/categories");
  return { success: true };
}

// ─── Delete ──────────────────────────────────────────────────────────────────
export async function deleteCategory(id: string) {
  const userId = await requireUser();

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      // Count attached expenses — don't load all records, just count
      _count: { select: { expenses: true } },
    },
  });

  if (!category || category.userId !== userId) {
    return { error: "Category not found" };
  }

  // Business rule: can't delete a category that has expenses
  if (category._count.expenses > 0) {
    return {
      error: `Cannot delete — ${category._count.expenses} expense(s) use this category`,
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/dashboard/categories");
  return { success: true };
}

// ─── Read ─────────────────────────────────────────────────────────────────────
// This one is used directly in the Server Component — not a "server action"
// but a plain async function called on the server
export async function getCategories() {
  const userId = await requireUser();

  return prisma.category.findMany({
    where: { userId },
    include: {
      _count: { select: { expenses: true } },
    },
    orderBy: { name: "asc" },
  });
}
