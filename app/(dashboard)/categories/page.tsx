// app/(dashboard)/categories/page.tsx
import { getCategories } from "@/actions/categories";
import CategoriesClient from "./CategoriesClient";

export const metadata = {
  title: "Categories — ExpenseAI",
};

export default async function CategoriesPage() {
  // Direct DB call — no API route needed, this runs on the server
  const categories = await getCategories();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Categories
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Organize your expenses into categories
        </p>
      </div>

      {/* 
        Why a separate CategoriesClient component?
        Because we need to manage editTarget state (which category is being edited)
        and that requires useState — which means client component.
        But we can't make the whole page client-side or we lose server-side data fetching.
        Solution: keep the page server-side, pass data to a client shell.
      */}
      <CategoriesClient categories={categories} />
    </div>
  );
}
