import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSelect } from '@/components/settings/SettingsSelect';
import { SettingsShell, type SettingsCategory } from '@/components/settings/SettingsShell';
import { listVaults } from '@/lib/backend';
import {
  GENERATOR_MODE_OPTIONS,
  THEME_OPTIONS,
  getVaultSettings,
  updateVaultSetting,
  type GeneratorDefaultMode,
  type ThemePreference,
  type VaultSettings,
} from '@/lib/settings';
import { logError } from '@/utils/logger';
import type { Vault } from '@/utils/types';

interface SettingsLocationState {
  vaultId?: string;
}

const categoryCopy: Record<SettingsCategory, { title: string; subtitle: string }> = {
  security: {
    title: 'Security',
    subtitle: 'Control vault locking and clipboard hygiene for the selected vault.',
  },
  appearance: {
    title: 'Appearance',
    subtitle: 'Choose the visual theme preference for this vault workspace.',
  },
  generator: {
    title: 'Generator',
    subtitle: 'Set the default password generator mode for vault-scoped generator surfaces.',
  },
  data: {
    title: 'Data Management',
    subtitle: 'Import and export vault data from one organized settings area.',
  },
};

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as SettingsLocationState | null;
  const initialVaultId = routeState?.vaultId;

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('security');
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState(initialVaultId ?? '');
  const [settings, setSettings] = useState<VaultSettings | null>(null);
  const [isLoadingVaults, setIsLoadingVaults] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  const activeCopy = categoryCopy[activeCategory];
  const selectedVault = useMemo(
    () => vaults.find(vault => vault.id === selectedVaultId),
    [selectedVaultId, vaults],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadVaults() {
      try {
        const rows = await listVaults();
        if (!isMounted) return;
        setVaults(rows);
        if (!selectedVaultId && rows.length > 0) {
          setSelectedVaultId(rows[0].id);
        }
      } catch (error) {
        logError('Failed to load vaults for settings', error);
        toast.error('Failed to load vaults');
      } finally {
        if (isMounted) setIsLoadingVaults(false);
      }
    }

    loadVaults();

    return () => {
      isMounted = false;
    };
  }, [selectedVaultId]);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      if (!selectedVaultId) {
        setSettings(null);
        return;
      }

      setIsLoadingSettings(true);
      try {
        const loaded = await getVaultSettings(selectedVaultId);
        if (isMounted) setSettings(loaded);
      } catch (error) {
        logError('Failed to load settings', error);
        toast.error('Failed to load settings');
      } finally {
        if (isMounted) setIsLoadingSettings(false);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [selectedVaultId]);

  const handleBack = useCallback(() => {
    if (initialVaultId && selectedVaultId) {
      navigate('/dashboard', { state: { vaultId: selectedVaultId }, replace: true });
      return;
    }

    navigate('/vaults', { replace: true });
  }, [initialVaultId, navigate, selectedVaultId]);

  const handleSettingChange = async <K extends keyof Omit<VaultSettings, 'vault_id'>>(
    key: K,
    value: VaultSettings[K],
  ) => {
    if (!selectedVaultId) return;

    setSettings(prev => (prev ? { ...prev, [key]: value } : prev));
    try {
      const next = await updateVaultSetting(selectedVaultId, key, value);
      setSettings(next);
      toast.success('Settings saved');
    } catch (error) {
      logError('Failed to save setting', error);
      toast.error('Failed to save setting');
      const restored = await getVaultSettings(selectedVaultId);
      setSettings(restored);
    }
  };

  const isSettingDisabled = isLoadingVaults || isLoadingSettings || !selectedVaultId || !settings;

  return (
    <SettingsShell
      activeCategory={activeCategory}
      title={activeCopy.title}
      subtitle={activeCopy.subtitle}
      onBack={handleBack}
      onCategoryChange={setActiveCategory}
    >
      <div className="border-b border-border/20 py-5">
        <div className="flex items-center justify-between gap-8">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Vault context</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {selectedVault
                ? `Editing settings for ${selectedVault.name}.`
                : 'Select a vault before editing vault-scoped settings.'}
            </p>
          </div>
          <SettingsSelect
            value={selectedVaultId}
            options={vaults.map(vault => ({ label: vault.name, value: vault.id }))}
            disabled={isLoadingVaults || vaults.length === 0}
            onChange={setSelectedVaultId}
          />
        </div>
      </div>

      {activeCategory === 'security' && (
        <SecuritySettings
          settings={settings}
          disabled={isSettingDisabled}
          onAutoLockChange={(value) => handleSettingChange('auto_lock_duration', value)}
          onClipboardClearChange={(value) => handleSettingChange('clipboard_clear_delay', value)}
        />
      )}

      {activeCategory === 'appearance' && (
        <SettingsRow
          title="Theme"
          description="Choose the preferred theme for this vault. Theme application is part of the next implementation slice."
        >
          <SettingsSelect
            value={settings?.theme ?? 'dark'}
            options={THEME_OPTIONS}
            disabled={isSettingDisabled}
            onChange={(value: ThemePreference) => handleSettingChange('theme', value)}
          />
        </SettingsRow>
      )}

      {activeCategory === 'generator' && (
        <SettingsRow
          title="Default generator mode"
          description="Choose which generator opens first for vault-scoped password creation."
        >
          <SettingsSelect
            value={settings?.default_generator_mode ?? 'standard'}
            options={GENERATOR_MODE_OPTIONS}
            disabled={isSettingDisabled}
            onChange={(value: GeneratorDefaultMode) => handleSettingChange('default_generator_mode', value)}
          />
        </SettingsRow>
      )}

      {activeCategory === 'data' && (
        <div className="py-5">
          <h3 className="text-sm font-semibold text-foreground">Import and export</h3>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Data Management will move vault export and advanced import actions here after the Security settings slice is verified.
          </p>
        </div>
      )}
    </SettingsShell>
  );
}
