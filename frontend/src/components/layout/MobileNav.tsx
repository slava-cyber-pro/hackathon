import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";

const tabs = [
  { to: "/", label: "Home", icon: "📊" },
  { to: "/transactions", label: "Txns", icon: "💳" },
  { to: "/investments", label: "Invest", icon: "📈" },
  { to: "/budgets", label: "Budgets", icon: "🎯" },
  { to: "/settings", label: "More", icon: "☰" },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white lg:hidden dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400",
              )
            }
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
