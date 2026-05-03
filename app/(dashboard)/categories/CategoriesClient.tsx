// app/(dashboard)/categories/CategoriesClient.tsx
"use client";

import { useState } from "react";
import CategoryForm from "@/components/categories/CategoryForm";
import CategoryList from "@/components/categories/CategoryList";

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  _count: { expenses: number };
}

export default function CategoriesClient({
  categories,
}: {
  categories: Category[];
}) {
  // Which category are we editing? null = we're in create mode
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form — col span 1 */}
      <div className="lg:col-span-1">
        <CategoryForm
          editTarget={editTarget}
          onDone={() => setEditTarget(null)}
        />
      </div>

      {/* List — col span 2 */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Your Categories
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({categories.length})
            </span>
          </h2>
        </div>

        <CategoryList
          categories={categories}
          onEdit={(cat) => setEditTarget(cat)}
        />
      </div>
    </div>
  );
}
