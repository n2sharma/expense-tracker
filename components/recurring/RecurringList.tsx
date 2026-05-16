// components/recurring/RecurringList.tsx
"use client";

import { useState, useTransition } from "react";
import { stopRecurring, deleteRecurring } from "@/actions/recurring";
import { StopCircle, Trash2, RefreshCw } from "lucide-react";

interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  recurringFrequency: string | null;
  recurringStartDate: Date | null;
  recurringEndDate: Date | null;
  category: { name: string; color: string } | null;
  _count: { childExpenses: number };
}

interface Props {
  expenses: RecurringExpense[];
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export default function RecurringList({ expenses }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleStop(id: string) {
    if (
      !confirm(
        "Stop this recurring expense? No more entries will be generated."
      )
    )
      return;

    startTransition(async () => {
      const result = await stopRecurring(id);
      if (result?.error) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    if (
      !confirm("Delete this recurring expense and all its generated entries?")
    )
      return;

    startTransition(async () => {
      const result = await deleteRecurring(id);
      if (result?.error) setError(result.error);
    });
  }

  if (expenses.length === 0) {
    return (
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl border
                      border-gray-200 dark:border-neutral-700 p-12 text-center"
      >
        <p className="text-4xl mb-3">🔄</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No recurring expenses yet.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Create one from the Expenses page by selecting "Recurring" type.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 text-red-600
                        dark:text-red-400 text-sm p-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {expenses.map((expense) => {
        const isActive =
          !expense.recurringEndDate ||
          new Date(expense.recurringEndDate) >= new Date();

        return (
          <div
            key={expense.id}
            className="bg-white dark:bg-neutral-800 rounded-xl border
                       border-gray-200 dark:border-neutral-700 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left side */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg bg-purple-100
                                dark:bg-purple-900/30 flex items-center
                                justify-center shrink-0"
                >
                  <RefreshCw
                    size={16}
                    className="text-purple-600
                                                  dark:text-purple-400"
                  />
                </div>

                <div className="min-w-0">
                  <p
                    className="font-medium text-gray-900 dark:text-white
                                truncate"
                  >
                    {expense.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {/* Frequency badge */}
                    <span
                      className="text-xs bg-purple-100 dark:bg-purple-900/30
                                     text-purple-700 dark:text-purple-400
                                     px-2 py-0.5 rounded-full"
                    >
                      {FREQUENCY_LABELS[expense.recurringFrequency ?? ""] ??
                        "—"}
                    </span>

                    {/* Category badge */}
                    {expense.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: expense.category.color + "20",
                          color: expense.category.color,
                        }}
                      >
                        {expense.category.name}
                      </span>
                    )}

                    {/* Active/Stopped status */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isActive ? "Active" : "Stopped"}
                    </span>
                  </div>

                  {/* Date range */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Started{" "}
                    {expense.recurringStartDate
                      ? new Date(expense.recurringStartDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "—"}
                    {expense.recurringEndDate && (
                      <>
                        {" "}
                        · Ends{" "}
                        {new Date(expense.recurringEndDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </>
                    )}
                  </p>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {expense._count.childExpenses} entries generated
                  </p>
                </div>
              </div>

              {/* Right side — amount + actions */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{expense.amount.toLocaleString("en-IN")}
                </p>

                <div className="flex items-center gap-1">
                  {isActive && (
                    <button
                      onClick={() => handleStop(expense.id)}
                      disabled={isPending}
                      className="p-1.5 text-gray-400 hover:text-orange-600
                                 hover:bg-orange-50 dark:hover:bg-orange-900/20
                                 rounded-lg transition disabled:opacity-40"
                      title="Stop recurring"
                    >
                      <StopCircle size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={isPending}
                    className="p-1.5 text-gray-400 hover:text-red-600
                               hover:bg-red-50 dark:hover:bg-red-900/20
                               rounded-lg transition disabled:opacity-40"
                    title="Delete all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
