// app/(dashboard)/budgets/page.tsx
import { getBudgets } from "@/actions/budgets";
import { getCategories } from "@/actions/categories";
import BudgetsClient from "./BudgetsClient";

export const metadata = { title: "Budgets — ExpenseAI" };

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function BudgetsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const [budgets, categories] = await Promise.all([
    getBudgets(month, year),
    getCategories(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Budgets
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Set limits and track spending by category
        </p>
      </div>

      <BudgetsClient
        budgets={budgets}
        categories={categories}
        month={month}
        year={year}
      />
    </div>
  );
}
