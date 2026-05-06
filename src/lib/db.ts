import { invoke } from '@tauri-apps/api/core';

export async function initDb(): Promise<void> {
  await invoke('init_db');
}

export async function ensureVaultSettingsSchema(): Promise<void> {
  await invoke('init_db');
}

export async function hasVaults(): Promise<boolean> {
  return invoke<boolean>('has_vaults');
}
