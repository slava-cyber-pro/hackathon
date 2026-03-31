export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export interface PasswordStrength {
  label: string;
  color: string;
  width: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { label: "", color: "", width: "0%" };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [password.length >= 8, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 3) return { label: "Medium", color: "bg-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}
