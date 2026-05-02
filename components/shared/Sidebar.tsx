// components/shared/Sidebar.tsx
"use client";
// ↑ Must be client component because usePathname() is a client-side hook

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  RefreshCw,
  Tag,
  Settings,
  LogOut,
} from "lucide-react";

// Type for what we need from session.user
interface SidebarUser {
  name?: string | null;
  email?: string | null;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { label: "Budgets", href: "/dashboard/budgets", icon: Wallet },
  { label: "Recurring", href: "/dashboard/recurring", icon: RefreshCw },
  { label: "Categories", href: "/dashboard/categories", icon: Tag },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 h-screen bg-white dark:bg-neutral-800 border-r 
                      border-gray-200 dark:border-neutral-700 flex flex-col 
                      shrink-0"
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-neutral-700">
        <span className="font-bold text-xl text-gray-900 dark:text-white">
          💰 ExpenseAI
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          // Active if pathname matches exactly OR starts with href (for sub-routes)
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm 
                font-medium transition-colors
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
                }
              `}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout — pinned to bottom */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar initials */}
          <div
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center 
                          justify-center text-white text-xs font-bold shrink-0"
          >
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name ?? "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 
                     dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 
                     rounded-lg transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
