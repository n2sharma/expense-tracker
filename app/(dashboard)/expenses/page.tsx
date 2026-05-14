// app/(dashboard)/expenses/page.tsx
import { getExpenses } from "@/actions/expenses";
import { getCategories } from "@/actions/categories";
import ExpensesClient from "./ExpensesClient";

export const metadata = { title: "Expenses — ExpenseAI" };

interface PageProps {
  searchParams: Promise<{
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Run both fetches in parallel
  const [data, categories] = await Promise.all([
    getExpenses({
      categoryId: params.categoryId,
      startDate: params.startDate,
      endDate: params.endDate,
      search: params.search,
      page: params.page ? parseInt(params.page) : 1,
    }),
    getCategories(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Expenses
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {data.total} expense{data.total !== 1 ? "s" : ""} total
        </p>
      </div>

      <ExpensesClient initialData={data} categories={categories} />
    </div>
  );
}
