// components/budgets/BudgetForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createBudget, updateBudget, getAISuggestion } from "@/actions/budgets";
import { Sparkles, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface BudgetForEdit {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string | null;
}

interface AISuggestion {
  conservative: number;
  recommended: number;
  comfortable: number;
  reasoning: string;
  confidence: "low" | "medium" | "high";
}

interface Props {
  categories: Category[];
  editTarget?: BudgetForEdit | null;
  onDone: () => void;
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

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

export default function BudgetForm({ categories, editTarget, onDone }: Props) {
  const isEditing = !!editTarget;

  const [selectedMonth, setSelectedMonth] = useState(
    editTarget?.month ?? new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    editTarget?.year ?? currentYear
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    editTarget?.categoryId ?? ""
  );
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    formData.set("month", String(selectedMonth));
    formData.set("year", String(selectedYear));
    formData.set("categoryId", selectedCategoryId);

    startTransition(async () => {
      const result = isEditing
        ? await updateBudget(editTarget.id, formData)
        : await createBudget(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  async function handleAISuggestion() {
    setAiError("");
    setSuggestion(null);
    setIsLoadingAI(true);

    const result = await getAISuggestion(
      selectedCategoryId || null,
      selectedMonth,
      selectedYear
    );

    setIsLoadingAI(false);

    if (result.error) {
      setAiError(result.error);
      return;
    }

    if (result.suggestion) {
      setSuggestion(result.suggestion);
    }
  }

  function applyAmount(amount: number) {
    // Find the amount input and set its value directly
    const input = document.getElementById("budget-amount") as HTMLInputElement;
    if (input) input.value = String(amount);
    setSuggestion(null);
  }

  const confidenceColor = {
    low: "text-orange-500",
    medium: "text-yellow-500",
    high: "text-green-500",
  };

  return (
    <div
      className="bg-white dark:bg-neutral-800 rounded-xl border
                    border-gray-200 dark:border-neutral-700 p-6"
    >
      <h2 className="font-semibold text-gray-900 dark:text-white mb-5">
        {isEditing ? "Edit Budget" : "New Budget"}
      </h2>

      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 text-red-600
                        dark:text-red-400 text-sm p-3 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {/* Month + Year — disabled when editing */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-sm font-medium text-gray-700
                              dark:text-gray-300 mb-1"
            >
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setSuggestion(null);
              }}
              disabled={isEditing}
              className="w-full border border-gray-300 dark:border-neutral-600
                         rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700
                         text-gray-900 dark:text-white focus:outline-none
                         focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700
                              dark:text-gray-300 mb-1"
            >
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSuggestion(null);
              }}
              disabled={isEditing}
              className="w-full border border-gray-300 dark:border-neutral-600
                         rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700
                         text-gray-900 dark:text-white focus:outline-none
                         focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label
            className="block text-sm font-medium text-gray-700
                            dark:text-gray-300 mb-1"
          >
            Category
            <span className="ml-1 text-xs text-gray-400">
              (optional = overall)
            </span>
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSuggestion(null);
            }}
            disabled={isEditing}
            className="w-full border border-gray-300 dark:border-neutral-600
                       rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700
                       text-gray-900 dark:text-white focus:outline-none
                       focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Overall (all expenses)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount + AI button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className="block text-sm font-medium text-gray-700
                              dark:text-gray-300"
            >
              Budget Amount <span className="text-red-500">*</span>
            </label>

            {/* Only show AI button when not editing */}
            {!isEditing && (
              <button
                type="button"
                onClick={handleAISuggestion}
                disabled={isLoadingAI}
                className="flex items-center gap-1.5 text-xs text-purple-600
                           dark:text-purple-400 hover:text-purple-700 transition
                           disabled:opacity-50"
              >
                {isLoadingAI ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Sparkles size={12} />
                )}
                {isLoadingAI ? "Analyzing..." : "AI Suggest"}
              </button>
            )}
          </div>

          <input
            id="budget-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={editTarget?.amount ?? ""}
            placeholder="0.00"
            required
            className="w-full border border-gray-300 dark:border-neutral-600
                       rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-700
                       text-gray-900 dark:text-white focus:outline-none
                       focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* AI Error */}
        {aiError && (
          <p className="text-xs text-orange-500 dark:text-orange-400">
            {aiError}
          </p>
        )}

        {/* AI Suggestion Cards */}
        {suggestion && (
          <div
            className="bg-purple-50 dark:bg-purple-900/20 rounded-xl
                          border border-purple-100 dark:border-purple-800 p-4
                          space-y-3"
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-medium text-purple-700
                            dark:text-purple-300 flex items-center gap-1"
              >
                <Sparkles size={12} />
                AI Recommendation
              </p>
              <span
                className={`text-xs font-medium ${
                  confidenceColor[suggestion.confidence]
                }`}
              >
                {suggestion.confidence} confidence
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
              {suggestion.reasoning}
            </p>

            {/* Three options */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Conservative",
                  value: suggestion.conservative,
                  color: "blue",
                },
                {
                  label: "Recommended",
                  value: suggestion.recommended,
                  color: "green",
                },
                {
                  label: "Comfortable",
                  value: suggestion.comfortable,
                  color: "orange",
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => applyAmount(opt.value)}
                  className={`p-2 rounded-lg border text-center transition
                    border-gray-200 dark:border-neutral-600 hover:border-${opt.color}-400
                    bg-white dark:bg-neutral-700 hover:bg-${opt.color}-50
                    dark:hover:bg-${opt.color}-900/20`}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {opt.label}
                  </p>
                  <p
                    className="text-sm font-semibold text-gray-900
                                dark:text-white mt-0.5"
                  >
                    ₹{opt.value.toLocaleString("en-IN")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                       text-white text-sm font-medium py-2 rounded-lg transition"
          >
            {isPending
              ? "Saving..."
              : isEditing
              ? "Update Budget"
              : "Create Budget"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 text-sm border border-gray-300
                       dark:border-neutral-600 text-gray-600 dark:text-gray-400
                       rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700
                       transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
