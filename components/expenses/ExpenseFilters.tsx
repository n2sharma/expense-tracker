// components/expenses/ExpenseFilters.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function ExpenseFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Build a new URL with updated search params
  // This is the standard Next.js pattern for filter-driven pages
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Always reset to page 1 when filters change
      params.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  function clearFilters() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveFilters =
    searchParams.has("search") ||
    searchParams.has("categoryId") ||
    searchParams.has("startDate") ||
    searchParams.has("endDate");

  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-xl border 
                     border-gray-200 dark:border-neutral-700 p-4 mb-6
                     ${isPending ? "opacity-60" : ""} transition-opacity`}
    >
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 
                                       text-gray-400"
          />
          <input
            type="text"
            placeholder="Search expenses..."
            defaultValue={searchParams.get("search") ?? ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 
                       dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 
                       text-gray-900 dark:text-white focus:outline-none 
                       focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category filter */}
        <select
          defaultValue={searchParams.get("categoryId") ?? ""}
          onChange={(e) => updateFilter("categoryId", e.target.value)}
          className="py-2 px-3 text-sm border border-gray-300 dark:border-neutral-600 
                     rounded-lg bg-white dark:bg-neutral-700 text-gray-900 
                     dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          defaultValue={searchParams.get("startDate") ?? ""}
          onChange={(e) => updateFilter("startDate", e.target.value)}
          className="py-2 px-3 text-sm border border-gray-300 dark:border-neutral-600 
                     rounded-lg bg-white dark:bg-neutral-700 text-gray-900 
                     dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          defaultValue={searchParams.get("endDate") ?? ""}
          onChange={(e) => updateFilter("endDate", e.target.value)}
          className="py-2 px-3 text-sm border border-gray-300 dark:border-neutral-600 
                     rounded-lg bg-white dark:bg-neutral-700 text-gray-900 
                     dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm text-gray-500 
                       hover:text-gray-700 dark:text-gray-400 
                       dark:hover:text-gray-200 transition"
          >
            <SlidersHorizontal size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
