import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { randDigit } from '@/utils/helpers';
import { secureIntBelow, securePickFromString } from '@/utils/secureRandom';
import { PRESET_PATTERNS } from './constants';
import { PasswordDisplay } from './PasswordDisplay';

interface PatternTabProps {
  onUsePassword?: (password: string) => void;
}

export function PatternTab({ onUsePassword }: PatternTabProps) {
  const [password, setPassword] = useState('');
  const [pattern, setPattern] = useState('Wwww####@@');
  const [selectedPreset, setSelectedPreset] = useState('Web');
  const activePreset = PRESET_PATTERNS.find(preset => preset.label === selectedPreset) ?? PRESET_PATTERNS[0];

  const applyPreset = (preset: typeof PRESET_PATTERNS[number]) => {
    if (preset.label === 'Custom') {
      setSelectedPreset('Custom');
      return;
    }

    setSelectedPreset(preset.label);
    setPattern(preset.pattern);
  };

  const generate = useCallback(() => {
    let result = '';
    for (const ch of pattern) {
      switch (ch) {
        case 'W':
          result += String.fromCharCode(65 + secureIntBelow(26));
          break;
        case 'w':
          result += String.fromCharCode(97 + secureIntBelow(26));
          break;
        case '#':
          result += randDigit();
          break;
        case '@':
          result += securePickFromString('!@#$%^&*');
          break;
        default:
          result += ch;
      }
    }
    setPassword(result);
  }, [pattern]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  }, [generate]);

  return (
    <div className="space-y-3 lg:space-y-5">
      <PasswordDisplay password={password} onRegenerate={generate} onUsePassword={onUsePassword} />

      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Presets</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {PRESET_PATTERNS.map(preset => (
            <button key={preset.label} onClick={() => applyPreset(preset)} className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold border transition-all',
              selectedPreset === preset.label ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-transparent border-border/30 text-muted-foreground hover:border-border/60',
            )}>{preset.label}</button>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground/70">{activePreset.description}</p>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Template</span>
        <Input
          value={pattern}
          onChange={(e) => { setPattern(e.target.value); setSelectedPreset('Custom'); }}
          className="font-mono text-sm bg-[#0A0A0A] border-border/40"
          placeholder="e.g. Wwww####@@"
          maxLength={32}
        />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Append Character</span>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            { key: 'W', desc: 'Uppercase (A-Z)' },
            { key: 'w', desc: 'Lowercase (a-z)' },
            { key: '#', desc: 'Digit (0-9)' },
            { key: '@', desc: 'Symbol (!@#$%^&*)' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setPattern(p => p + item.key)}
              className="rounded-md flex items-center gap-3 px-4 py-2.5 text-left border border-border/30 text-muted-foreground hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-all"
            >
              <code className="text-brand text-sm font-mono font-bold bg-brand/10 px-2 py-0.5 rounded shrink-0">{item.key}</code>
              <span className="text-xs">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/50">Click a button above to append it to the template. Any other character is kept literally.</p>
    </div>
  );
}
