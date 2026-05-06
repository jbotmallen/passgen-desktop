import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CircuitLines from '@/components/CircuitLines';
import { CreateVaultDialog } from '@/components/vault-selector/CreateVaultDialog';
import { UnlockVaultDialog } from '@/components/vault-selector/UnlockVaultDialog';
import { VaultFooter } from '@/components/vault-selector/VaultFooter';
import { VaultGrid } from '@/components/vault-selector/VaultGrid';
import { VaultTopLogo } from '@/components/vault-selector/VaultTopLogo';
import { createVault, listVaults, unlockVaultById } from '@/lib/backend';
import { checkLockout, clearAttempts, registerFailure } from '@/lib/unlockGuard';
import { logError } from '@/utils/logger';
import type { CreateVaultOutput, UnlockVaultOutput } from '@/lib/schemas/vault';
import type { Vault } from '@/utils/types';

export default function VaultSelector() {
  const location = useLocation();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [unlockError, setUnlockError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const loadVaults = useCallback(async () => {
    try {
      setVaults(await listVaults());
    } catch (error) {
      logError('Failed to load vaults', error);
    }
  }, []);

  useEffect(() => {
    if (location.state?.autoOpenCreate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreateModalOpen(true);
    }

    loadVaults();
  }, [loadVaults, location.state]);

  const handleSelectVault = (vault: Vault) => {
    setSelectedVault(vault);
    setUnlockError('');
    setIsUnlockModalOpen(true);
  };

  const handleCreateVault = async (values: CreateVaultOutput) => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      await createVault({ name: values.name, icon: values.icon, password: values.password });

      setIsCreateModalOpen(false);
      loadVaults();
    } catch (error) {
      logError('Failed to create vault', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUnlockVault = async (values: UnlockVaultOutput) => {
    if (!selectedVault || isUnlocking) return;

    setIsUnlocking(true);
    try {
      const guard = await checkLockout(selectedVault.id);
      if (!guard.allowed) {
        const secs = Math.ceil(guard.waitMs / 1000);
        setUnlockError(`Too many failed attempts. Try again in ${secs}s.`);
        return;
      }

      const result = await unlockVaultById(selectedVault.id, values.password);

      if (result.success) {
        await clearAttempts(selectedVault.id);
        setIsUnlockModalOpen(false);
        navigate('/dashboard', { state: { vaultId: selectedVault.id } });
      } else {
        const fail = await registerFailure(selectedVault.id);
        if (fail.locked) {
          setUnlockError('Vault locked for 1 hour due to repeated failed attempts.');
        } else if (fail.waitMs > 0) {
          setUnlockError(`Incorrect master password. Wait ${Math.ceil(fail.waitMs / 1000)}s before retrying.`);
        } else {
          setUnlockError(result.error || 'Incorrect master password');
        }
      }
    } catch (error) {
      logError('Failed to unlock', error);
      setUnlockError('An error occurred');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      <VaultTopLogo onNavigateWelcome={() => navigate('/welcome')} />
      <CircuitLines />

      <VaultGrid
        vaults={vaults}
        onSelectVault={handleSelectVault}
        onCreateVault={() => setIsCreateModalOpen(true)}
      />

      <VaultFooter onOpenSettings={() => navigate('/settings')} />

      <CreateVaultDialog
        open={isCreateModalOpen}
        isLoading={isCreating}
        onOpenChange={(open) => !isCreating && setIsCreateModalOpen(open)}
        onCreateVault={handleCreateVault}
      />

      <UnlockVaultDialog
        open={isUnlockModalOpen}
        selectedVault={selectedVault}
        error={unlockError}
        isLoading={isUnlocking}
        onOpenChange={(open) => {
          if (isUnlocking) return;
          setIsUnlockModalOpen(open);
          if (!open) {
            setUnlockError('');
          }
        }}
        onUnlock={handleUnlockVault}
      />
    </div>
  );
}
