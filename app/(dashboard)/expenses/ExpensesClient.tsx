// app/(dashboard)/expenses/ExpensesClient.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ExpenseFilters from "@/components/expenses/ExpenseFilters";
import ExpenseList from "@/components/expenses/ExpenseList";
import ExpenseForm from "@/components/expenses/ExpenseForm";

// Re-using the same interface shape returned by getExpenses
interface Props {
  initialData: Awaited<
    ReturnType<typeof import("@/actions/expenses").getExpenses>
  >;
  categories: Array<{ id: string; name: string; color: string }>;
}

export default function ExpensesClient({ initialData, categories }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<
    Props["initialData"]["expenses"][number] | null
  >(null);

  function handleEdit(expense: Props["initialData"]["expenses"][number]) {
    setEditTarget(expense);
    setShowForm(true);
  }

  function handleDone() {
    setShowForm(false);
    setEditTarget(null);
  }

  return (
    <>
      {/* Add button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setEditTarget(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 
                     text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      <ExpenseFilters categories={categories} />

      <ExpenseList
        expenses={initialData.expenses}
        totalPages={initialData.totalPages}
        currentPage={initialData.currentPage}
        onEdit={handleEdit}
      />

      {/* Modal — only renders when showForm is true */}
      {showForm && (
        <ExpenseForm
          categories={categories}
          editTarget={editTarget}
          onDone={handleDone}
        />
      )}
    </>
  );
}
