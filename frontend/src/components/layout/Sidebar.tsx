import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import CurrencyPicker from "@/components/ui/CurrencyPicker";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/transactions", label: "Transactions", icon: "💳" },
  { to: "/investments", label: "Investments", icon: "📈" },
  { to: "/budgets", label: "Budgets", icon: "🎯" },
  { to: "/team", label: "Team", icon: "👥" },
  { to: "/analytics", label: "Analytics", icon: "📉" },
];

export default function Sidebar() {
  const { theme, toggle } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.display_name
    ? user.display_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-sm font-bold">
          B
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">BudgetSphere</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
              )
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Profile section */}
      <div className="relative border-t border-gray-200 px-3 py-3 dark:border-gray-700">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {initials}
          </div>
          <div className="flex-1 text-left">
            <p className="truncate font-medium text-gray-900 dark:text-gray-100">
              {user?.display_name ?? "User"}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {user?.email ?? ""}
            </p>
          </div>
          <span className="text-gray-400">{menuOpen ? "▲" : "▼"}</span>
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => { toggle(); setMenuOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span>{theme === "dark" ? "☀️" : "🌙"}</span>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>

            <CurrencyPicker className="w-full" />

            <NavLink
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span>⚙️</span> Settings
            </NavLink>
            <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <span>🚪</span> Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
