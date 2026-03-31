import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";
import { validateEmail, validatePassword } from "@/utils/validation";
import { login as apiLogin, getMe } from "@/api/auth";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setErrors({ email: emailErr ?? undefined, password: passErr ?? undefined });
    return !emailErr && !passErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await apiLogin(email, password);
      const user = await getMe();
      setUser(user);
      navigate("/");
    } catch {
      setErrors({ form: "Invalid email or password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
            B
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">BudgetSphere</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {errors.form}
            </div>
          )}

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <div className="relative">
            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">or</span>
            </div>
          </div>

          <Link to="/register">
            <Button type="button" variant="outline" className="w-full">
              Create an account
            </Button>
          </Link>
        </form>
      </div>
    </div>
  );
}
