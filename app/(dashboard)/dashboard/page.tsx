// app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {session?.user?.name} 👋
        </p>
      </div>

      {/* Placeholder stat cards — we'll replace these in Phase 12 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {["Total Spent", "Monthly Budget", "Categories", "Recurring"].map(
          (label) => (
            <div
              key={label}
              className="bg-white dark:bg-neutral-800 rounded-xl border 
                       border-gray-200 dark:border-neutral-700 p-6"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                —
              </p>
            </div>
          )
        )}
      </div>

      <div
        className="bg-white dark:bg-neutral-800 rounded-xl border 
                      border-gray-200 dark:border-neutral-700 p-6"
      >
        <p className="text-gray-400 text-sm text-center py-8">
          Charts and recent expenses will appear here as you add data.
        </p>
      </div>
    </div>
  );
}
