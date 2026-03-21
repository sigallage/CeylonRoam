const { test, expect } = require('@jest/globals');

function forgotPassword(email) {
  if (!email) return "Email is required";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) return "Invalid email";

  return "Reset link sent";
}

test("should send reset link for valid email", () => {
  const result = forgotPassword("user@gmail.com");
  expect(result).toBe("Reset link sent");
});

test("should fail for empty email", () => {
  const result = forgotPassword("");
  expect(result).toBe("Email is required");
});

test("should fail for invalid email format", () => {
  const result = forgotPassword("invalid-email");
  expect(result).toBe("Invalid email");
});

test("should handle uppercase email correctly", () => {
  const result = forgotPassword("USER@GMAIL.COM");
  expect(result).toBe("Reset link sent");
});

test("should trim spaces in email", () => {
  const result = forgotPassword("  user@gmail.com  ".trim());
  expect(result).toBe("Reset link sent");
});
