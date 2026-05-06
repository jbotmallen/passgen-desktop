import type { ReactNode } from 'react';
import {
  IconArrowLeft,
  IconDatabase,
  IconPalette,
  IconSettingsAutomation,
  IconShieldLock,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export type SettingsCategory = 'security' | 'appearance' | 'generator' | 'data';

const categories = [
  { id: 'security' as const, label: 'Security', icon: IconShieldLock },
  { id: 'appearance' as const, label: 'Appearance', icon: IconPalette },
  { id: 'generator' as const, label: 'Generator', icon: IconSettingsAutomation },
  { id: 'data' as const, label: 'Data Management', icon: IconDatabase },
];

interface SettingsShellProps {
  activeCategory: SettingsCategory;
  title: string;
  subtitle: string;
  children: ReactNode;
  onBack: () => void;
  onCategoryChange: (category: SettingsCategory) => void;
}

export function SettingsShell({
  activeCategory,
  title,
  subtitle,
  children,
  onBack,
  onCategoryChange,
}: SettingsShellProps) {
  return (
    <div className="flex h-screen w-full bg-[#111111] text-foreground">
      <aside className="flex w-72 shrink-0 flex-col border-r border-border/40 bg-[#0A0A0A]">
        <div className="border-b border-border/20 p-6">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-xs text-muted-foreground">Vault preferences and local data controls.</p>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onCategoryChange(id)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                activeCategory === id
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted-foreground hover:bg-[#1A1A1A] hover:text-foreground',
              )}
            >
              <Icon size={18} stroke={1.5} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-10 py-10">
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Pass Gen</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
          <section className="border-y border-border/20">{children}</section>
        </div>
      </main>
    </div>
  );
}
