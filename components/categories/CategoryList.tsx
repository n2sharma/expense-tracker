// components/categories/CategoryList.tsx
"use client";

import { useState, useTransition } from "react";
import { deleteCategory } from "@/actions/categories";
import { Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  _count: { expenses: number };
}

interface Props {
  categories: Category[];
  onEdit: (category: Category) => void;
}

export default function CategoryList({ categories, onEdit }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    // Simple confirm — in production you'd use a proper dialog component
    if (!confirm("Delete this category?")) return;

    setDeletingId(id);
    setError(null);

    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result?.error) {
        setError(result.error);
      }
      setDeletingId(null);
    });
  }

  if (categories.length === 0) {
    return (
      <div
        className="bg-white dark:bg-neutral-800 rounded-xl border 
                      border-gray-200 dark:border-neutral-700 p-8 text-center"
      >
        <p className="text-4xl mb-3">🏷️</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No categories yet. Create your first one!
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

      {categories.map((cat) => (
        <div
          key={cat.id}
          className="bg-white dark:bg-neutral-800 rounded-xl border 
                     border-gray-200 dark:border-neutral-700 px-4 py-3 
                     flex items-center justify-between gap-4"
        >
          {/* Left: color dot + name + expense count */}
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <div className="min-w-0">
              <p
                className="text-sm font-medium text-gray-900 
                            dark:text-white truncate"
              >
                {cat.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {cat._count.expenses} expense
                {cat._count.expenses !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(cat)}
              className="p-2 text-gray-400 hover:text-blue-600 
                         hover:bg-blue-50 dark:hover:bg-blue-900/20 
                         rounded-lg transition"
              title="Edit"
            >
              <Pencil size={15} />
            </button>

            <button
              onClick={() => handleDelete(cat.id)}
              disabled={isPending && deletingId === cat.id}
              className="p-2 text-gray-400 hover:text-red-600 
                         hover:bg-red-50 dark:hover:bg-red-900/20 
                         rounded-lg transition disabled:opacity-40"
              title={
                cat._count.expenses > 0
                  ? "Can't delete — has expenses"
                  : "Delete"
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
