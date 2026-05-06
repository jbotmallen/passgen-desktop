import { z } from 'zod';

// Centralized input sanitization + validation. All schemas accept `string`
// input, run a `.transform()` to clean (strip control chars, trim, etc.),
// then pipe into a refinement schema that enforces length/format. This
// keeps `z.input` = string for clean react-hook-form inference.

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;
// Notes preserve \t \n \r; strip everything else in C0 + DEL.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_KEEP_WS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const TITLE_MAX = 100;
const URL_MAX = 2048;
const NOTES_MAX = 4000;
const VAULT_NAME_MAX = 32;
const ENTRY_PASSWORD_MAX = 256;
const MASTER_PASSWORD_MIN = 12;
const MASTER_PASSWORD_MAX = 128;
const USERNAME_MAX = 128;
const EMAIL_MAX = 254;
const TAG_MAX = 32;
const SEED_WORD_MAX = 64;

const stripCtrlTrim = (s: string) => s.replace(CONTROL_CHARS, '').trim();
const stripCtrlKeepWs = (s: string) => s.replace(CONTROL_CHARS_KEEP_WS, '');

// ── Username / Email ──────────────────────────────────────────────────
function normalizeUserOrEmail(input: string): string {
  const stripped = input.replace(CONTROL_CHARS, '').trim();
  if (!stripped.includes('@')) return stripped;
  const atIdx = stripped.lastIndexOf('@');
  const local = stripped.slice(0, atIdx);
  const domain = stripped.slice(atIdx + 1).toLowerCase();
  return `${local}@${domain}`;
}

const emailInner = z
  .email({ message: 'Invalid email format' })
  .max(EMAIL_MAX, 'Email is too long');

const usernameInner = z
  .string()
  .max(USERNAME_MAX, 'Username is too long')
  .regex(/^[^@\s]+$/, 'Invalid characters in username');

export const usernameOrEmailSchema = z
  .string()
  .transform(normalizeUserOrEmail)
  .pipe(
    z.string().superRefine((val, ctx) => {
      if (val.length === 0) return;
      const target = val.includes('@') ? emailInner : usernameInner;
      const result = target.safeParse(val);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({ code: 'custom', message: issue.message });
        }
      }
    }),
  );

// ── Title ─────────────────────────────────────────────────────────────
export const titleSchema = z
  .string()
  .transform(stripCtrlTrim)
  .pipe(
    z
      .string()
      .min(1, 'Title is required')
      .max(TITLE_MAX, `Title must not exceed ${TITLE_MAX} characters`),
  );

// ── Website URL ───────────────────────────────────────────────────────
export const urlSchema = z
  .string()
  .transform(stripCtrlTrim)
  .pipe(
    z
      .string()
      .max(URL_MAX, 'URL is too long')
      .refine((val) => {
        if (!val) return true;
        try {
          const u = new URL(val);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      }, 'URL must be a valid http:// or https:// address'),
  );

// ── Notes ─────────────────────────────────────────────────────────────
export const notesSchema = z
  .string()
  .transform(stripCtrlKeepWs)
  .pipe(z.string().max(NOTES_MAX, `Notes must not exceed ${NOTES_MAX} characters`));

// ── Vault name ────────────────────────────────────────────────────────
export const vaultNameSchema = z
  .string()
  .transform(stripCtrlTrim)
  .pipe(
    z
      .string()
      .min(1, 'Vault name is required')
      .max(VAULT_NAME_MAX, `Vault name must not exceed ${VAULT_NAME_MAX} characters`),
  );

// ── Master password ───────────────────────────────────────────────────
// Argon2id KDF in src-tauri/src/crypto.rs caps at 128 chars after NFC
// normalization. Match here so UI rejects oversized input before invoke.
export const masterPasswordSchema = z
  .string()
  .min(MASTER_PASSWORD_MIN, `Master password must be at least ${MASTER_PASSWORD_MIN} characters`)
  .max(MASTER_PASSWORD_MAX, `Master password must not exceed ${MASTER_PASSWORD_MAX} characters`);

// ── Entry password (stored value, not KDF input) ──────────────────────
export const entryPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .max(ENTRY_PASSWORD_MAX, `Password must not exceed ${ENTRY_PASSWORD_MAX} characters`);

// ── Tag ───────────────────────────────────────────────────────────────
export const tagSchema = z
  .string()
  .transform((v) => v.replace(CONTROL_CHARS, '').trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'Tag is required')
      .max(TAG_MAX, `Tag must not exceed ${TAG_MAX} characters`)
      .regex(/^[a-z0-9_-]+$/, 'Tags may only contain letters, numbers, dashes, and underscores'),
  );

// ── Generator seed word ───────────────────────────────────────────────
export const seedWordSchema = z
  .string()
  .transform(stripCtrlTrim)
  .pipe(z.string().max(SEED_WORD_MAX, `Seed word must not exceed ${SEED_WORD_MAX} characters`));

// ── Generic helper to extract first error message ─────────────────────
export interface SanitizeResult<T = string> {
  value: T;
  valid: boolean;
  error?: string;
}

export function runSchema<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  fallback: T,
): SanitizeResult<T> {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { value: result.data, valid: true };
  }
  return {
    value: fallback,
    valid: false,
    error: result.error.issues[0]?.message ?? 'Invalid input',
  };
}

// Back-compat wrapper preserving the existing call-site shape.
export interface UsernameSanitizeResult {
  value: string;
  isEmail: boolean;
  valid: boolean;
  error?: string;
}

export function sanitizeUsernameOrEmail(raw: string): UsernameSanitizeResult {
  const normalized = (typeof raw === 'string' ? raw : '').replace(CONTROL_CHARS, '').trim();
  const isEmail = normalized.includes('@');
  const result = usernameOrEmailSchema.safeParse(raw);
  if (result.success) {
    return { value: result.data, isEmail, valid: true };
  }
  return {
    value: normalized,
    isEmail,
    valid: false,
    error: result.error.issues[0]?.message ?? (isEmail ? 'Invalid email' : 'Invalid input'),
  };
}

// Field length caps re-exported for `maxLength` attributes on inputs.
export const LIMITS = {
  TITLE_MAX,
  URL_MAX,
  NOTES_MAX,
  VAULT_NAME_MAX,
  ENTRY_PASSWORD_MAX,
  MASTER_PASSWORD_MIN,
  MASTER_PASSWORD_MAX,
  USERNAME_MAX,
  EMAIL_MAX,
  TAG_MAX,
  SEED_WORD_MAX,
} as const;
