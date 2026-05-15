// components/budgets/BudgetCard.tsx
"use client";

import { useTransition } from "react";
import { deleteBudget } from "@/actions/budgets";
import { Pencil, Trash2 } from "lucide-react";

interface BudgetWithSpending {
  id: string;
  amount: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  category: { id: string; name: string; color: string } | null;
}

interface Props {
  budget: BudgetWithSpending;
  onEdit: (budget: BudgetWithSpending) => void;
  onError: (msg: string) => void;
}

export default function BudgetCard({ budget, onEdit, onError }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this budget?")) return;

    startTransition(async () => {
      const result = await deleteBudget(budget.id);
      if (result?.error) onError(result.error);
    });
  }

  // Progress bar color based on percentage
  const barColor =
    budget.percentage >= 100
      ? "bg-red-500"
      : budget.percentage >= 90
      ? "bg-orange-500"
      : budget.percentage >= 75
      ? "bg-yellow-500"
      : "bg-green-500";

  const categoryColor = budget.category?.color ?? "#6366F1";

  return (
    <div
      className="bg-white dark:bg-neutral-800 rounded-xl border
                    border-gray-200 dark:border-neutral-700 overflow-hidden"
    >
      {/* Card header — colored by category */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: categoryColor + "15" }}
        // +15 = 15% opacity hex trick
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <span className="font-medium text-sm text-gray-900 dark:text-white">
            {budget.category?.name ?? "Overall"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 text-gray-400 hover:text-blue-600
                       hover:bg-white/50 rounded-lg transition"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-gray-400 hover:text-red-600
                       hover:bg-white/50 rounded-lg transition disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-4 space-y-3">
        {/* Amount overview */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
            <p
              className={`text-lg font-bold ${
                budget.isOverBudget
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              ₹{budget.spent.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{budget.amount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-2 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {budget.percentage}% used
            </span>
            <span
              className={`text-xs font-medium ${
                budget.isOverBudget
                  ? "text-red-500"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {budget.isOverBudget
                ? `₹${Math.abs(budget.remaining).toLocaleString("en-IN")} over`
                : `₹${budget.remaining.toLocaleString("en-IN")} left`}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div>
          {budget.isOverBudget ? (
            <span
              className="inline-block text-xs bg-red-100 dark:bg-red-900/30
                             text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full"
            >
              Over budget
            </span>
          ) : budget.percentage >= 90 ? (
            <span
              className="inline-block text-xs bg-orange-100
                             dark:bg-orange-900/30 text-orange-700
                             dark:text-orange-400 px-2 py-0.5 rounded-full"
            >
              Almost full
            </span>
          ) : budget.percentage >= 75 ? (
            <span
              className="inline-block text-xs bg-yellow-100
                             dark:bg-yellow-900/30 text-yellow-700
                             dark:text-yellow-400 px-2 py-0.5 rounded-full"
            >
              Watch spending
            </span>
          ) : (
            <span
              className="inline-block text-xs bg-green-100
                             dark:bg-green-900/30 text-green-700
                             dark:text-green-400 px-2 py-0.5 rounded-full"
            >
              On track
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
