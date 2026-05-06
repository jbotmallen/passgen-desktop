import { z } from 'zod';
import { vaultNameSchema, masterPasswordSchema } from '@/utils/sanitize';

export const createVaultSchema = z.object({
  name: vaultNameSchema,
  icon: z.string().min(1, 'Pick an icon'),
  password: masterPasswordSchema,
});

export type CreateVaultInput = z.input<typeof createVaultSchema>;
export type CreateVaultOutput = z.output<typeof createVaultSchema>;

export const unlockVaultSchema = z.object({
  password: masterPasswordSchema,
});

export type UnlockVaultInput = z.input<typeof unlockVaultSchema>;
export type UnlockVaultOutput = z.output<typeof unlockVaultSchema>;
