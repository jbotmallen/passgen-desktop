import { z } from 'zod';
import {
  titleSchema,
  urlSchema,
  notesSchema,
  entryPasswordSchema,
  usernameOrEmailSchema,
} from '@/utils/sanitize';

// Entry form schema — composes per-field schemas from `utils/sanitize`.
// Used as the single source of truth for AddEntry / Edit form validation
// via react-hook-form + zodResolver.

export const entryFormSchema = z.object({
  title: titleSchema,
  username: usernameOrEmailSchema,
  url: urlSchema,
  password: entryPasswordSchema,
  notes: notesSchema,
});

export type EntryFormInput = z.input<typeof entryFormSchema>;
export type EntryFormOutput = z.output<typeof entryFormSchema>;
