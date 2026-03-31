import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useThemeStore } from "@/stores/themeStore";

export default function AppLayout() {
  const { theme, toggle } = useThemeStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              B
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">BudgetSphere</span>
          </div>
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            <span className="text-xl">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
