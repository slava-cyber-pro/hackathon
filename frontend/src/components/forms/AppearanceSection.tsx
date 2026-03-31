import Card, { CardTitle } from "@/components/ui/Card";
import CurrencyPicker from "@/components/ui/CurrencyPicker";
import { cn } from "@/utils/cn";
import { useThemeStore } from "@/stores/themeStore";

export default function AppearanceSection() {
  const { theme, setTheme } = useThemeStore();

  return (
    <Card>
      <CardTitle>Appearance</CardTitle>

      <div className="mt-6 space-y-6">
        {/* Theme picker */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </p>
          <div className="flex gap-4">
            <ThemeOption
              label="Light"
              active={theme === "light"}
              onClick={() => setTheme("light")}
              icon={<SunIcon />}
              iconBg="bg-yellow-100 text-yellow-600"
            />
            <ThemeOption
              label="Dark"
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              icon={<MoonIcon />}
              iconBg="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
            />
          </div>
        </div>

        {/* Currency selector */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Currency</p>
          <CurrencyPicker />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Small private helpers kept in the same file                         */
/* ------------------------------------------------------------------ */

interface ThemeOptionProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
}

function ThemeOption({ label, active, onClick, icon, iconBg }: ThemeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
        active
          ? "border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-950"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600",
      )}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconBg)}>
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}
