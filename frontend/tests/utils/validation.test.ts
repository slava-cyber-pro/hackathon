import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword, getPasswordStrength } from "@/utils/validation";

describe("validateEmail", () => {
  it("returns null for valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });

  it("returns error for empty string", () => {
    expect(validateEmail("")).toBe("Email is required");
  });

  it("returns error for invalid format", () => {
    expect(validateEmail("not-an-email")).toBe("Invalid email format");
  });
});

describe("validatePassword", () => {
  it("returns null for 8+ char password", () => {
    expect(validatePassword("abcdefgh")).toBeNull();
  });

  it("returns error for short password", () => {
    expect(validatePassword("abc")).toBe("Password must be at least 8 characters");
  });

  it("returns error for empty string", () => {
    expect(validatePassword("")).toBe("Password is required");
  });
});

describe("getPasswordStrength", () => {
  it("returns Weak for < 6 chars", () => {
    expect(getPasswordStrength("abc")).toEqual({ label: "Weak", color: "bg-red-500", width: "33%" });
  });

  it("returns Strong for complex password", () => {
    expect(getPasswordStrength("Abcdef1!")).toEqual({ label: "Strong", color: "bg-green-500", width: "100%" });
  });

  it("returns empty for empty string", () => {
    expect(getPasswordStrength("")).toEqual({ label: "", color: "", width: "0%" });
  });
});
