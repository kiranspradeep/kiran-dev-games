import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── Password strength validation ──────────────────────────────────────────────
export interface PasswordStrength {
  valid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("At least 8 characters required");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter required");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter required");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number required");
  }

  return { valid: errors.length === 0, errors };
}