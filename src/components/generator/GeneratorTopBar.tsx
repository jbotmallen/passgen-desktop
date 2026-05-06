import { IconArrowLeft } from '@tabler/icons-react';

interface GeneratorTopBarProps {
  onBack: () => void;
  onNavigateWelcome: () => void;
}

export function GeneratorTopBar({ onBack, onNavigateWelcome }: GeneratorTopBarProps) {
  return (
    <div className="flex items-center justify-between px-8 py-4 z-20 shrink-0">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
        <IconArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>
      <a href="/welcome" onClick={(e) => { e.preventDefault(); onNavigateWelcome(); }} className="flex items-center gap-2 group">
        <img src="/logo.png" alt="Pass Gen" className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(245,197,99,0.4)] transition-all" />
        <span className="font-semibold text-xs tracking-widest text-foreground uppercase">Pass Gen</span>
      </a>
      <div className="w-16" />
    </div>
  );
}

