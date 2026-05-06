import { IconLock, IconSearch, IconShieldCheck, IconUpload } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';

interface DashboardTopNavProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onNavigateWelcome: () => void;
  onOpenImport?: () => void;
}

export function DashboardTopNav({
  searchQuery,
  onSearchQueryChange,
  onNavigateWelcome,
  onOpenImport,
}: DashboardTopNavProps) {
  return (
    <div className="absolute top-0 w-full h-14 border-b border-border/40 flex items-center justify-between pr-2 md:px-6 z-20 bg-[#111111]">
      <a href="/welcome" onClick={(e) => { e.preventDefault(); onNavigateWelcome(); }} className="flex items-center gap-3 group cursor-pointer">
        <div className='grid place-content-center size-16 md:size-fit'>
          <img src="/logo.png" alt="Pass Gen" className="w-6 h-6 group-hover:drop-shadow-[0_0_8px_rgba(245,197,99,0.4)] transition-all" />
        </div>
        <span className="font-semibold text-xs tracking-widest text-brand hidden md:block">PASS</span>
        <span className="font-semibold text-xs tracking-widest text-foreground -ml-2 hidden md:block">GEN</span>
      </a>

      <div className="flex items-center gap-4">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="bg-[#1A1A1A] border border-border/50 rounded-md py-1.5 pl-9 pr-4 text-sm w-64 focus-visible:ring-1 focus-visible:ring-brand transition-colors placeholder:text-muted-foreground/50"
          />
        </div>
        <button className="hidden lg:flex items-center gap-2 text-xs font-semibold text-brand bg-brand/10 px-3 py-1.5 rounded-md"><IconShieldCheck size={14} /> Encrypted at rest</button>
        <button className="hidden lg:flex items-center gap-2 text-xs font-semibold text-foreground bg-border/20 px-3 py-1.5 rounded-md"><IconLock size={14} /> Local only</button>
        {onOpenImport && (
          <button onClick={onOpenImport} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-brand hover:bg-brand/10 bg-border/20 px-3 py-1.5 rounded-md transition-colors">
            <IconUpload size={14} /> Import JSON
          </button>
        )}
      </div>
    </div>
  );
}

