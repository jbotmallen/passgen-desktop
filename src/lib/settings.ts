import * as backend from '@/lib/backend';

export type ThemePreference = 'dark' | 'light' | 'system';
export type GeneratorDefaultMode = 'standard' | 'passphrase' | 'pattern' | 'mnemonic' | 'phonetic';

export interface VaultSettings {
  vault_id: string;
  auto_lock_duration: number;
  clipboard_clear_delay: number;
  theme: ThemePreference;
  default_generator_mode: GeneratorDefaultMode;
}

export const DEFAULT_VAULT_SETTINGS = {
  auto_lock_duration: 300000,
  clipboard_clear_delay: 30000,
  theme: 'dark' as ThemePreference,
  default_generator_mode: 'standard' as GeneratorDefaultMode,
};

export const AUTO_LOCK_OPTIONS = [
  { label: '1 min', value: 60000 },
  { label: '5 mins', value: 300000 },
  { label: '15 mins', value: 900000 },
  { label: 'Never', value: 0 },
];

export const CLIPBOARD_CLEAR_OPTIONS = [
  { label: '15s', value: 15000 },
  { label: '30s', value: 30000 },
  { label: '60s', value: 60000 },
  { label: 'Never', value: 0 },
];

export const THEME_OPTIONS: Array<{ label: string; value: ThemePreference }> = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
];

export const GENERATOR_MODE_OPTIONS: Array<{ label: string; value: GeneratorDefaultMode }> = [
  { label: 'Standard', value: 'standard' },
  { label: 'Passphrase', value: 'passphrase' },
  { label: 'Pattern', value: 'pattern' },
  { label: 'Mnemonic', value: 'mnemonic' },
  { label: 'Phonetic', value: 'phonetic' },
];

const SETTINGS_COLUMNS = {
  auto_lock_duration: 'auto_lock_duration',
  clipboard_clear_delay: 'clipboard_clear_delay',
  theme: 'theme',
  default_generator_mode: 'default_generator_mode',
} satisfies Record<keyof Omit<VaultSettings, 'vault_id'>, string>;

// Runtime allowlist — defends against any caller bypassing TS types via casts.
const ALLOWED_COLUMNS: ReadonlySet<string> = new Set<string>([
  'auto_lock_duration',
  'clipboard_clear_delay',
  'theme',
  'default_generator_mode',
]);

export async function ensureVaultSettings(vaultId: string): Promise<void> {
  await backend.ensureVaultSettings(vaultId);
}

export async function getVaultSettings(vaultId: string): Promise<VaultSettings> {
  return backend.getVaultSettings(vaultId);
}

export async function updateVaultSetting<K extends keyof Omit<VaultSettings, 'vault_id'>>(
  vaultId: string,
  key: K,
  value: VaultSettings[K],
): Promise<VaultSettings> {
  if (!Object.prototype.hasOwnProperty.call(SETTINGS_COLUMNS, key)) {
    throw new Error('Invalid setting key');
  }
  const column = SETTINGS_COLUMNS[key];
  if (!ALLOWED_COLUMNS.has(column)) {
    throw new Error('Invalid setting column');
  }
  return backend.updateVaultSetting(column, value, vaultId);
}
