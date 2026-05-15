// app/(dashboard)/budgets/BudgetsClient.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import BudgetCard from "@/components/budgets/BudgetCard";
import BudgetForm from "@/components/budgets/BudgetForm";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

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
  budgets: BudgetWithSpending[];
  categories: Category[];
  month: number;
  year: number;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BudgetsClient({
  budgets,
  categories,
  month,
  year,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetWithSpending | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navigate(newMonth: number, newYear: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function prevMonth() {
    if (month === 1) navigate(12, year - 1);
    else navigate(month - 1, year);
  }

  function nextMonth() {
    if (month === 12) navigate(1, year + 1);
    else navigate(month + 1, year);
  }

  function handleEdit(budget: BudgetWithSpending) {
    setEditTarget(budget);
    setShowForm(true);
  }

  function handleDone() {
    setShowForm(false);
    setEditTarget(null);
  }

  // Summary totals
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700
                       hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
          >
            <ChevronLeft size={16} />
          </button>

          <span
            className="font-semibold text-gray-900 dark:text-white min-w-36
                           text-center"
          >
            {MONTHS[month - 1]} {year}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-gray-200 dark:border-neutral-700
                       hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                     text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Add Budget
        </button>
      </div>

      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 text-red-600
                        dark:text-red-400 text-sm p-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* Overall summary */}
      {budgets.length > 0 && (
        <div
          className="bg-white dark:bg-neutral-800 rounded-xl border
                        border-gray-200 dark:border-neutral-700 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Monthly Overview
            </h2>
            <span
              className={`text-sm font-medium ${
                overallPct >= 100
                  ? "text-red-500"
                  : overallPct >= 75
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            >
              {overallPct}% used
            </span>
          </div>

          <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overallPct >= 100
                  ? "bg-red-500"
                  : overallPct >= 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>

          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              ₹{totalSpent.toLocaleString("en-IN")} spent
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              ₹{totalBudget.toLocaleString("en-IN")} total
            </span>
          </div>
        </div>
      )}

      {/* Budget grid or empty state */}
      {budgets.length === 0 ? (
        <div
          className="bg-white dark:bg-neutral-800 rounded-xl border
                        border-gray-200 dark:border-neutral-700 p-12 text-center"
        >
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No budgets for {MONTHS[month - 1]} {year}.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Create your first budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEdit}
              onError={setError}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center
                        justify-center p-4"
        >
          <div className="w-full max-w-md">
            <BudgetForm
              categories={categories}
              editTarget={
                editTarget
                  ? {
                      id: editTarget.id,
                      amount: editTarget.amount,
                      month: editTarget.month,
                      year: editTarget.year,
                      categoryId: editTarget.category?.id ?? null,
                    }
                  : null
              }
              onDone={handleDone}
            />
          </div>
        </div>
      )}
    </div>
  );
}
