import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => (
  <div className="space-y-1">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
    )}
    <input
      ref={ref}
      id={id}
      className={cn(
        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
        "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500",
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600",
        className,
      )}
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
));
Input.displayName = "Input";
export default Input;
