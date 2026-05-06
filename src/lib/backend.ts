import { invoke } from '@tauri-apps/api/core';
import type { VaultSettings } from '@/lib/settings';
import type { Entry, Vault } from '@/utils/types';

export interface CryptoResp<T = string> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface EntryRow {
  id: string;
  title: string;
  username?: string | null;
  website_url?: string | null;
  strength?: Entry['strength'] | null;
  category?: string | null;
  is_favorite?: number | null;
  tags?: string | null;
  encrypted_password?: string | null;
  encrypted_totp_seed?: string | null;
  encrypted_notes?: string | null;
  encrypted_fields?: string | null;
  updated_at?: string | null;
}

export interface EntryEditRow {
  id: string;
  title: string;
  username?: string | null;
  website_url?: string | null;
}

export interface ImportEntryInput {
  vault_id: string;
  title: string;
  username: string | null;
  url: string | null;
  password: string;
  notes: string | null;
  category: string;
  created_at: string | null;
  updated_at: string | null;
}

export function listVaults(): Promise<Vault[]> {
  return invoke<Vault[]>('list_vaults');
}

export function createVault(input: { name: string; icon: string; password: string }): Promise<string> {
  return invoke<string>('create_vault', input);
}

export function unlockVaultById(vaultId: string, password: string): Promise<CryptoResp<boolean>> {
  return invoke<CryptoResp<boolean>>('unlock_vault_by_id', { vaultId, password });
}

export function listEntries(vaultId: string): Promise<EntryRow[]> {
  return invoke<EntryRow[]>('list_entries', { vaultId });
}

export function getEntryForEdit(vaultId: string, entryId: string): Promise<EntryEditRow | null> {
  return invoke<EntryEditRow | null>('get_entry_for_edit', { vaultId, entryId });
}

export function decryptEntryField(
  vaultId: string,
  entryId: string,
  field: 'password' | 'notes' | 'totp_seed' | 'fields',
): Promise<CryptoResp> {
  return invoke<CryptoResp>('decrypt_entry_field', { vaultId, entryId, field });
}

export function saveEntry(input: {
  vaultId: string;
  entryId?: string;
  title: string;
  username: string | null;
  url: string | null;
  password: string;
  notes: string | null;
}): Promise<string> {
  return invoke<string>('save_entry', input);
}

export function importEntry(input: ImportEntryInput): Promise<string> {
  return invoke<string>('import_entry', { input });
}

export function toggleEntryFavorite(vaultId: string, entryId: string, isFavorite: boolean): Promise<void> {
  return invoke('toggle_entry_favorite', { vaultId, entryId, isFavorite });
}

export function deleteEntry(vaultId: string, entryId: string): Promise<void> {
  return invoke('delete_entry', { vaultId, entryId });
}

export function updateEntryTags(vaultId: string, entryId: string, tags: string): Promise<void> {
  return invoke('update_entry_tags', { vaultId, entryId, tags });
}

export function ensureVaultSettings(vaultId: string): Promise<void> {
  return invoke('ensure_vault_settings', { vaultId });
}

export function getVaultSettings(vaultId: string): Promise<VaultSettings> {
  return invoke<VaultSettings>('get_vault_settings', { vaultId });
}

export function updateVaultSetting(key: string, value: unknown, vaultId: string): Promise<VaultSettings> {
  return invoke<VaultSettings>('update_vault_setting', { vaultId, key, value });
}

export function checkLockout(vaultId: string): Promise<{ allowed: true } | { allowed: false; waitMs: number; permanent?: boolean }> {
  return invoke<{ allowed: boolean; wait_ms?: number; permanent?: boolean }>('check_lockout', { vaultId })
    .then((res) => (res.allowed ? { allowed: true } : { allowed: false, waitMs: res.wait_ms ?? 0, permanent: res.permanent }));
}

export function registerFailure(vaultId: string): Promise<{ waitMs: number; fails: number; locked: boolean }> {
  return invoke<{ wait_ms: number; fails: number; locked: boolean }>('register_failure', { vaultId })
    .then((res) => ({ waitMs: res.wait_ms, fails: res.fails, locked: res.locked }));
}

export function clearAttempts(vaultId: string): Promise<void> {
  return invoke('clear_attempts', { vaultId });
}
