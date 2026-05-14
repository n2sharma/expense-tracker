// components/expenses/ExpenseForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createExpense, updateExpense } from "@/actions/expenses";
import { X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseForEdit {
  id: string;
  title: string;
  amount: number | { toNumber: () => number }; // Prisma Decimal type
  date: Date;
  categoryId: string | null;
  description: string | null;
  type: "ONE_TIME" | "RECURRING";
  recurringFrequency: string | null;
  recurringStartDate: Date | null;
  recurringEndDate: Date | null;
}

interface Props {
  categories: Category[];
  editTarget?: ExpenseForEdit | null;
  onDone: () => void;
}

// Helper — Prisma returns Decimal objects, we need plain numbers
function toNumber(val: number | { toNumber: () => number }): number {
  return typeof val === "number" ? val : val.toNumber();
}

// Helper — format Date to YYYY-MM-DD for date input defaultValue
function toDateInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export default function ExpenseForm({ categories, editTarget, onDone }: Props) {
  const [type, setType] = useState<"ONE_TIME" | "RECURRING">(
    editTarget?.type ?? "ONE_TIME"
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isEditing = !!editTarget;

  function handleSubmit(formData: FormData) {
    setError("");
    // Inject the type since it's controlled by state, not a real select
    formData.set("type", type);

    startTransition(async () => {
      const result = isEditing
        ? await updateExpense(editTarget.id, formData)
        : await createExpense(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    // Backdrop — clicking outside closes the form
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center 
                    justify-center p-4"
    >
      <div
        className="bg-white dark:bg-neutral-800 rounded-2xl w-full 
                      max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b 
                        border-gray-200 dark:border-neutral-700"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </h2>
          <button
            onClick={onDone}
            className="p-2 text-gray-400 hover:text-gray-600 
                       rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="bg-red-50 dark:bg-red-900/20 text-red-600 
                            dark:text-red-400 text-sm p-3 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 
                              dark:text-gray-300 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              defaultValue={editTarget?.title ?? ""}
              placeholder="e.g. Netflix subscription"
              required
              className="w-full border border-gray-300 dark:border-neutral-600 
                         rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                         text-gray-900 dark:text-white focus:outline-none 
                         focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount + Date — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 
                                dark:text-gray-300 mb-1"
              >
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editTarget ? toNumber(editTarget.amount) : ""}
                placeholder="0.00"
                required
                className="w-full border border-gray-300 dark:border-neutral-600 
                           rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                           text-gray-900 dark:text-white focus:outline-none 
                           focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 
                                dark:text-gray-300 mb-1"
              >
                Date <span className="text-red-500">*</span>
              </label>
              <input
                name="date"
                type="date"
                defaultValue={
                  editTarget
                    ? toDateInput(editTarget.date)
                    : toDateInput(new Date())
                }
                required
                className="w-full border border-gray-300 dark:border-neutral-600 
                           rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                           text-gray-900 dark:text-white focus:outline-none 
                           focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 
                              dark:text-gray-300 mb-1"
            >
              Category
            </label>
            <select
              name="categoryId"
              defaultValue={editTarget?.categoryId ?? ""}
              className="w-full border border-gray-300 dark:border-neutral-600 
                         rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                         text-gray-900 dark:text-white focus:outline-none 
                         focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 
                              dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              name="description"
              defaultValue={editTarget?.description ?? ""}
              placeholder="Optional note"
              rows={2}
              className="w-full border border-gray-300 dark:border-neutral-600 
                         rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                         text-gray-900 dark:text-white focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Type Toggle */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 
                              dark:text-gray-300 mb-2"
            >
              Expense Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["ONE_TIME", "RECURRING"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium 
                    transition border
                    ${
                      type === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-neutral-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-neutral-600"
                    }`}
                >
                  {t === "ONE_TIME" ? "One-time" : "Recurring"}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring fields — only shown when type is RECURRING */}
          {type === "RECURRING" && (
            <div
              className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 
                            rounded-xl border border-blue-100 dark:border-blue-800"
            >
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Recurring Settings
              </p>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 
                                  dark:text-gray-300 mb-1"
                >
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  name="recurringFrequency"
                  defaultValue={editTarget?.recurringFrequency ?? ""}
                  className="w-full border border-gray-300 dark:border-neutral-600 
                             rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                             text-gray-900 dark:text-white focus:outline-none 
                             focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 
                                    dark:text-gray-300 mb-1"
                  >
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="recurringStartDate"
                    type="date"
                    defaultValue={
                      editTarget
                        ? toDateInput(editTarget.recurringStartDate)
                        : toDateInput(new Date())
                    }
                    className="w-full border border-gray-300 dark:border-neutral-600 
                               rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                               text-gray-900 dark:text-white focus:outline-none 
                               focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 
                                    dark:text-gray-300 mb-1"
                  >
                    End Date
                    <span className="text-gray-400 text-xs ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    name="recurringEndDate"
                    type="date"
                    defaultValue={
                      editTarget ? toDateInput(editTarget.recurringEndDate) : ""
                    }
                    className="w-full border border-gray-300 dark:border-neutral-600 
                               rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700 
                               text-gray-900 dark:text-white focus:outline-none 
                               focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onDone}
              className="flex-1 py-2 text-sm border border-gray-300 
                         dark:border-neutral-600 text-gray-600 dark:text-gray-400 
                         rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 
                         transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 
                         text-white text-sm font-medium py-2 rounded-lg transition"
            >
              {isPending ? "Saving..." : isEditing ? "Update" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
