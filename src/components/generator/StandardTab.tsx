import { useCallback, useEffect, useState } from 'react';
import {
  IconAt,
  IconHash,
  IconLetterCase,
  IconLetterCaseUpper,
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { secureChance, secureIntBelow, securePickFromString, secureShuffle } from '@/utils/secureRandom';
import type { CharsetOption } from '@/utils/types';
import { LEET_MAP } from './constants';
import { PasswordDisplay } from './PasswordDisplay';
import { Toggle } from './Toggle';

interface StandardTabProps {
  onUsePassword?: (password: string) => void;
}

export function StandardTab({ onUsePassword }: StandardTabProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [useSeedWord, setUseSeedWord] = useState(false);
  const [seedWord, setSeedWord] = useState('');
  const [options, setOptions] = useState<CharsetOption[]>([
    { id: 'upper', label: 'ABC', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', enabled: true, icon: <IconLetterCaseUpper size={14} stroke={1.5} /> },
    { id: 'lower', label: 'abc', chars: 'abcdefghijklmnopqrstuvwxyz', enabled: true, icon: <IconLetterCase size={14} stroke={1.5} /> },
    { id: 'numbers', label: '123', chars: '0123456789', enabled: true, icon: <IconHash size={14} stroke={1.5} /> },
    { id: 'symbols', label: '#$&', chars: '!@#$%^&*()_+~`|}{[]:;?><,./-=', enabled: true, icon: <IconAt size={14} stroke={1.5} /> },
  ]);

  const toggleOption = (id: string) => {
    setOptions(prev => {
      const next = prev.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o);
      if (next.filter(o => o.enabled).length === 0) return prev;
      return next;
    });
  };

  const leetify = (word: string): string =>
    word.split('').map(ch => {
      if (LEET_MAP[ch] && secureChance(0.6)) return LEET_MAP[ch];
      return secureChance(0.5) ? ch.toUpperCase() : ch;
    }).join('');

  const generate = useCallback(() => {
    const enabledSets = options.filter(o => o.enabled);
    const charset = enabledSets.map(o => o.chars).join('');
    if (!charset) return;

    if (useSeedWord && seedWord.trim()) {
      const transformed = leetify(seedWord.trim());
      const seedPart = transformed.slice(0, Math.min(transformed.length, length));
      const remaining = length - seedPart.length;
      const filler: string[] = [];
      for (const set of enabledSets) filler.push(securePickFromString(set.chars));
      for (let i = filler.length; i < remaining; i++) filler.push(securePickFromString(charset));
      secureShuffle(filler);
      const insertAt = secureIntBelow(filler.length + 1);
      filler.splice(insertAt, 0, ...seedPart.split(''));
      setPassword(filler.slice(0, length).join(''));
    } else {
      const chars = enabledSets.map(o => securePickFromString(o.chars));
      const remaining = length - chars.length;
      for (let i = 0; i < remaining; i++) chars.push(securePickFromString(charset));
      secureShuffle(chars);
      setPassword(chars.join(''));
    }
  }, [options, length, useSeedWord, seedWord]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  }, [generate]);

  return (
    <div className="space-y-3 lg:space-y-5">
      <PasswordDisplay password={password} onRegenerate={generate} onUsePassword={onUsePassword} />

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Length</span>
          <span className="text-sm font-mono text-brand font-bold">{length}</span>
        </div>
        <input type="range" min="4" max="64" value={length} onChange={(e) => setLength(parseInt(e.target.value))} className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Characters</span>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {options.map(opt => (
            <button key={opt.id} onClick={() => toggleOption(opt.id)} className={cn(
              'rounded-md flex items-center justify-center gap-2 px-2 py-2.5 text-xs font-bold uppercase border transition-all',
              opt.enabled ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-transparent border-border/30 text-muted-foreground hover:border-border/60',
            )}>
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 lg:space-y-5 pt-3 border-t border-border/20">
        <Toggle label="Seed Word" value={useSeedWord} onChange={() => setUseSeedWord(!useSeedWord)} sub="Embed a word with leet substitutions (a -> @, e -> 3, s -> $, o -> 0)" />
        {useSeedWord && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <Input value={seedWord} onChange={(e) => setSeedWord(e.target.value)} placeholder="e.g. Tom, coffee, guitar" className="bg-[#0A0A0A] border-border/40 text-sm" maxLength={length} />
          </div>
        )}
      </div>
    </div>
  );
}
