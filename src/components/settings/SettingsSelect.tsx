import { useEffect, useId, useRef, useState } from 'react';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface SettingsSelectOption<T extends string | number> {
  label: string;
  value: T;
}

interface SettingsSelectProps<T extends string | number> {
  value: T;
  options: Array<SettingsSelectOption<T>>;
  disabled?: boolean;
  onChange: (value: T) => void;
}

export function SettingsSelect<T extends string | number>({
  value,
  options,
  disabled = false,
  onChange,
}: SettingsSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRenderMenu, setShouldRenderMenu] = useState(false);
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonId = useId();
  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRenderMenu(true);
      if (rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedMenuHeight = options.length * 36 + 10;
        
        if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
          setOpenDirection('up');
        } else {
          setOpenDirection('down');
        }
      }
    }
  }, [isOpen, options.length]);

  useEffect(() => {
    if (disabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (nextValue: T) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-40">
      <button
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-3 rounded-md border border-border/50 bg-[#0A0A0A] px-3 text-left text-sm text-foreground outline-none transition-all duration-200 hover:border-brand/40 focus:border-brand disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'border-brand/60 shadow-[0_0_0_1px_rgba(245,197,99,0.12)]',
        )}
      >
        <span className="truncate">{selectedOption?.label ?? 'Select'}</span>
        <IconChevronDown
          size={16}
          className={cn('shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180 text-brand')}
        />
      </button>

      {shouldRenderMenu && !disabled && (
        <div
          role="listbox"
          aria-labelledby={buttonId}
          onAnimationEnd={() => {
            if (!isOpen) setShouldRenderMenu(false);
          }}
          className={cn(
            'settings-select-menu absolute right-0 z-50 w-full min-w-48 overflow-hidden rounded-md border border-border/60 bg-[#0A0A0A] p-1 shadow-2xl shadow-black/40',
            openDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2',
            !isOpen && 'settings-select-menu--closing pointer-events-none',
          )}
          style={{ transformOrigin: openDirection === 'down' ? 'top right' : 'bottom right' }}
        >
          {options.map(option => {
            const isSelected = option.value === value;

            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex h-9 w-full items-center justify-between gap-3 rounded px-2.5 text-left text-sm transition-colors duration-150',
                  isSelected
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-[#1A1A1A] hover:text-foreground',
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <IconCheck size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
