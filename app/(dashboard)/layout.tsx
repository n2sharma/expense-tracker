// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double-check auth here (middleware is the first gate, this is the second)
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Sidebar — fixed width, full height */}
      <Sidebar user={session.user} />

      {/* Main content — takes remaining space, scrollable */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
