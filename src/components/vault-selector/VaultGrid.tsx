import { IconPlus } from '@tabler/icons-react';
import { renderVaultIcon } from '@/utils/helpers';
import type { Vault } from '@/utils/types';

interface VaultGridProps {
  vaults: Vault[];
  onSelectVault: (vault: Vault) => void;
  onCreateVault: () => void;
}

export function VaultGrid({ vaults, onSelectVault, onCreateVault }: VaultGridProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-5xl mx-auto px-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Choose a vault to continue</h1>
      <p className="text-sm text-muted-foreground mb-12">Your vaults live only on this device.</p>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {vaults.map(vault => (
          <button
            key={vault.id}
            onClick={() => onSelectVault(vault)}
            className="relative chip-card w-48 h-56 group cursor-pointer"
          >
            <div className="chip-card-inner flex flex-col items-center justify-center h-full p-10">
              <div className="w-16 h-16 rounded-full border border-brand/20 flex items-center justify-center mb-4 group-hover:border-brand/50 transition-colors">
                {renderVaultIcon(vault.icon, 32, 1.5, 'text-brand')}
              </div>
              <span className="font-medium text-foreground mb-1">{vault.name}</span>
              <span className="text-xs text-muted-foreground">{vault.itemCount} items</span>
            </div>
          </button>
        ))}

        <button
          onClick={onCreateVault}
          className="relative chip-card w-48 h-56 group cursor-pointer border-dashed"
        >
          <div className="chip-card-inner flex flex-col items-center justify-center h-full bg-brand/5">
            <div className="w-16 h-16 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center mb-4 group-hover:border-brand/50 transition-colors">
              <IconPlus className="text-muted-foreground group-hover:text-brand transition-colors" size={24} stroke={1.5} />
            </div>
            <span className="font-medium text-brand">Add Vault</span>
          </div>
        </button>
      </div>
    </div>
  );
}
