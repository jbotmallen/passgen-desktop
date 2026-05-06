import { cn } from '@/lib/utils';
import { MODES } from './constants';

interface ModeSelectorProps {
  activeMode: string;
  onActiveModeChange: (mode: string) => void;
}

export function ModeSelector({ activeMode, onActiveModeChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-52 shrink-0">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-foreground">Generator</h1>
        <p className="text-sm text-muted-foreground">Choose a method</p>
      </div>

      {MODES.map(mode => (
        <button
          key={mode.id}
          onClick={() => onActiveModeChange(mode.id)}
          className={cn(
            'relative rounded-none border flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-sm',
            activeMode === mode.id ? 'border-brand/50 bg-brand/5' : 'border-border/20 hover:border-border/40 hover:bg-muted/10',
          )}
        >
          <div className="flex items-center gap-3 w-full">
            <div className={cn(
              'w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors border',
              activeMode === mode.id ? 'bg-brand/10 text-brand border-brand/30' : 'bg-muted/50 text-muted-foreground border-border/30',
            )}>
              {mode.icon}
            </div>
            <div className="min-w-0">
              <span className={cn('text-sm font-semibold block truncate', activeMode === mode.id ? 'text-brand' : 'text-foreground')}>{mode.label}</span>
              <span className="text-xs text-muted-foreground/60 block truncate">{mode.desc}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

