// app/(dashboard)/recurring/page.tsx
import { getRecurringExpenses } from "@/actions/recurring";
import RecurringList from "@/components/recurring/RecurringList";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = { title: "Recurring — ExpenseAI" };

export default async function RecurringPage() {
  const expenses = await getRecurringExpenses();

  // Stats
  const active = expenses.filter(
    (e) => !e.recurringEndDate || new Date(e.recurringEndDate) >= new Date()
  );
  const monthlyTotal = active
    .filter((e) => e.recurringFrequency === "MONTHLY")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recurring Expenses
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Auto-generated entries based on your schedule
          </p>
        </div>

        {/* Link to expenses page to create a new recurring */}
        <Link
          href="/expenses"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500
                     text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Add Recurring
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active", value: active.length, unit: "subscriptions" },
          {
            label: "Monthly Cost",
            value: `₹${monthlyTotal.toLocaleString("en-IN")}`,
            unit: "per month",
          },
          {
            label: "Total Generated",
            value: expenses.reduce((s, e) => s + e._count.childExpenses, 0),
            unit: "entries",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-neutral-800 rounded-xl border
                       border-gray-200 dark:border-neutral-700 p-5"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {stat.unit}
            </p>
          </div>
        ))}
      </div>

      <RecurringList expenses={expenses} />
    </div>
  );
}
