import { importEntry } from '@/lib/backend';
import {
  LIMITS,
  entryPasswordSchema,
  notesSchema,
  titleSchema,
  urlSchema,
  usernameOrEmailSchema,
} from '@/utils/sanitize';

export const LEGACY_IMPORT_LIMITS = {
  FILE_BYTES_MAX: 5 * 1024 * 1024,
  BLOCKS_MAX: 100,
  ENTRIES_MAX: 2000,
  CATEGORY_MAX: 64,
} as const;

export interface LegacyPassword {
  title?: string;
  accountName?: string;
  password?: string;
  url?: string | null;
  category?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface LegacyUserBlock {
  email?: string;
  username?: string;
  passwords?: LegacyPassword[];
}

export type LegacyImport = LegacyUserBlock | LegacyUserBlock[];

export interface ImportSummary {
  imported: number;
  skipped: number;
  skippedReasons: string[];
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // SQLite-friendly format: "YYYY-MM-DD HH:MM:SS"
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export function parseLegacyJson(raw: string): LegacyUserBlock[] {
  if (new TextEncoder().encode(raw).byteLength > LEGACY_IMPORT_LIMITS.FILE_BYTES_MAX) {
    throw new Error(`JSON file must be ${LEGACY_IMPORT_LIMITS.FILE_BYTES_MAX / 1024 / 1024} MB or smaller`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('File is not valid JSON');
  }

  const blocks = Array.isArray(parsed) ? parsed : [parsed];
  if (blocks.length > LEGACY_IMPORT_LIMITS.BLOCKS_MAX) {
    throw new Error(`Import has too many user blocks (max ${LEGACY_IMPORT_LIMITS.BLOCKS_MAX})`);
  }

  let entryCount = 0;
  for (const block of blocks) {
    if (!block || typeof block !== 'object' || Array.isArray(block)) {
      throw new Error('Unexpected JSON shape');
    }
    const passwords = (block as LegacyUserBlock).passwords;
    if (passwords !== undefined && !Array.isArray(passwords)) {
      throw new Error('Unexpected JSON shape: passwords must be an array');
    }
    entryCount += passwords?.length ?? 0;
    if (entryCount > LEGACY_IMPORT_LIMITS.ENTRIES_MAX) {
      throw new Error(`Import has too many entries (max ${LEGACY_IMPORT_LIMITS.ENTRIES_MAX})`);
    }
  }

  if (parsed && typeof parsed === 'object') return blocks as LegacyUserBlock[];
  throw new Error('Unexpected JSON shape');
}

function parseOptionalField(
  raw: unknown,
  schema: typeof titleSchema | typeof usernameOrEmailSchema | typeof urlSchema | typeof notesSchema,
  fieldName: string,
): { value: string | null; error?: string } {
  if (raw === null || raw === undefined || raw === '') return { value: null };
  if (typeof raw !== 'string') return { value: null, error: `${fieldName} must be a string` };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { value: null, error: parsed.error.issues[0]?.message ?? `${fieldName} is invalid` };
  return { value: parsed.data || null };
}

function parseCategory(raw: unknown): string {
  if (typeof raw !== 'string') return 'Login';
  // eslint-disable-next-line no-control-regex
  const category = raw.replace(/[\x00-\x1F\x7F]/g, '').trim();
  return category.slice(0, LEGACY_IMPORT_LIMITS.CATEGORY_MAX) || 'Login';
}

export async function importLegacyPasswords(
  vaultId: string,
  blocks: LegacyUserBlock[],
): Promise<ImportSummary> {
  const summary: ImportSummary = { imported: 0, skipped: 0, skippedReasons: [] };
  for (const block of blocks) {
    const fallback = block.email ?? block.username ?? null;
    const list = Array.isArray(block.passwords) ? block.passwords : [];

    for (const item of list) {
      const title = (item.title ?? '').trim();
      const password = item.password ?? '';

      const cleanTitle = titleSchema.safeParse(title);
      if (!cleanTitle.success) {
        summary.skipped++;
        summary.skippedReasons.push(title ? `"${title.slice(0, LIMITS.TITLE_MAX)}": ${cleanTitle.error.issues[0]?.message ?? 'invalid title'}` : 'Missing title');
        continue;
      }
      if (!password || password === '[REDACTED]') {
        summary.skipped++;
        summary.skippedReasons.push(`"${title}": missing or redacted password`);
        continue;
      }
      const cleanPassword = entryPasswordSchema.safeParse(password);
      if (!cleanPassword.success) {
        summary.skipped++;
        summary.skippedReasons.push(`"${cleanTitle.data}": ${cleanPassword.error.issues[0]?.message ?? 'invalid password'}`);
        continue;
      }

      const cleanUsername = parseOptionalField(item.accountName ?? fallback, usernameOrEmailSchema, 'username');
      const cleanUrl = parseOptionalField(item.url, urlSchema, 'url');
      const cleanNotes = parseOptionalField(item.notes, notesSchema, 'notes');
      const fieldError = cleanUsername.error ?? cleanUrl.error ?? cleanNotes.error;
      if (fieldError) {
        summary.skipped++;
        summary.skippedReasons.push(`"${cleanTitle.data}": ${fieldError}`);
        continue;
      }

      try {
        const username = cleanUsername.value;
        const url = cleanUrl.value;
        const category = parseCategory(item.category);
        const createdAt = normalizeTimestamp(item.createdAt);
        const updatedAt = normalizeTimestamp(item.updatedAt) ?? createdAt;

        await importEntry({
          vault_id: vaultId,
          title: cleanTitle.data,
          username,
          url,
          password: cleanPassword.data,
          notes: cleanNotes.value,
          category,
          created_at: createdAt,
          updated_at: updatedAt,
        });
        summary.imported++;
      } catch (e) {
        summary.skipped++;
        summary.skippedReasons.push(`"${cleanTitle.data}": ${(e as Error).message}`);
      }
    }
  }

  return summary;
}
