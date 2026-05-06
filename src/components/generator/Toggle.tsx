import { cn } from '@/lib/utils';

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: () => void;
  sub?: string;
  className?: string;
}

export function Toggle({ label, value, onChange, sub, className }: ToggleProps) {
  return (
    <button onClick={onChange} className={cn('flex items-center justify-between gap-4 py-0.5', className)}>
      <div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">{label}</span>
        {sub && <span className="text-[11px] text-muted-foreground/50">{sub}</span>}
      </div>
      <div className={cn('w-9 h-5 rounded-full flex items-center transition-colors px-0.5 shrink-0', value ? 'bg-brand/80 justify-end' : 'bg-muted justify-start')}>
        <span className={cn('w-4 h-4 rounded-full transition-colors shadow-sm', value ? 'bg-white' : 'bg-muted-foreground/40')} />
      </div>
    </button>
  );
}

