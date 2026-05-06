import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSelect } from '@/components/settings/SettingsSelect';
import {
  AUTO_LOCK_OPTIONS,
  CLIPBOARD_CLEAR_OPTIONS,
  type VaultSettings,
} from '@/lib/settings';

interface SecuritySettingsProps {
  settings: VaultSettings | null;
  disabled: boolean;
  onAutoLockChange: (value: number) => void;
  onClipboardClearChange: (value: number) => void;
}

export function SecuritySettings({
  settings,
  disabled,
  onAutoLockChange,
  onClipboardClearChange,
}: SecuritySettingsProps) {
  return (
    <>
      <SettingsRow
        title="Auto-lock timeout"
        description="Lock the current vault after a period of inactivity. Choose Never only for devices you fully control."
      >
        <SettingsSelect
          value={settings?.auto_lock_duration ?? 300000}
          options={AUTO_LOCK_OPTIONS}
          disabled={disabled}
          onChange={onAutoLockChange}
        />
      </SettingsRow>
      <SettingsRow
        title="Clipboard clear delay"
        description="Clear copied usernames, passwords, and one-time codes from the system clipboard after the selected delay."
      >
        <SettingsSelect
          value={settings?.clipboard_clear_delay ?? 30000}
          options={CLIPBOARD_CLEAR_OPTIONS}
          disabled={disabled}
          onChange={onClipboardClearChange}
        />
      </SettingsRow>
    </>
  );
}
