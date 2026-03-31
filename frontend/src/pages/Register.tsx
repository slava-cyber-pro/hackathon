import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { validateEmail, validatePassword, getPasswordStrength } from "@/utils/validation";
import { register as apiRegister, getMe } from "@/api/auth";

export default function Register() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const strength = getPasswordStrength(form.password);

  const validate = (): boolean => {
    const errs: Record<string, string | undefined> = {};
    if (!form.name.trim()) errs.name = "Display name is required";
    errs.email = validateEmail(form.email) ?? undefined;
    errs.password = validatePassword(form.password) ?? undefined;
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    setErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await apiRegister(form.email, form.password, form.name);
      const user = await getMe();
      setUser(user);
      navigate("/");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setErrors({ email: "An account with this email already exists" });
      } else {
        setErrors({ form: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Start tracking your finances</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {errors.form}
            </div>
          )}

          <Input id="name" label="Display name" placeholder="Alex" value={form.name} onChange={update("name")} error={errors.name} required />
          <Input id="email" label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} error={errors.email} required />

          <div>
            <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={update("password")} error={errors.password} required />
            {form.password && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{strength.label}</p>
              </div>
            )}
          </div>

          <Input id="confirm" label="Confirm password" type="password" placeholder="Confirm your password" value={form.confirm} onChange={update("confirm")} error={errors.confirm} required />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 hover:underline dark:text-primary-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
