import { useState, useCallback, useEffect } from 'react';
import { IconCopy, IconRefresh, IconCheck, IconShieldLock, IconLetterCase, IconLetterCaseUpper, IconHash, IconAt, IconSend } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { secureChance, secureIntBelow, securePickFromString, secureShuffle } from '@/utils/secureRandom';
import { useClipboard } from '@/utils/hooks';

interface GeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CharsetOption {
  id: string;
  label: string;
  chars: string;
  enabled: boolean;
  icon: React.ReactNode;
}

// Leet-speak style substitution map
const LEET_MAP: Record<string, string> = {
  a: '@', A: '4', e: '3', E: '3', i: '!', I: '1',
  o: '0', O: '0', s: '$', S: '5', t: '+', T: '7',
  l: '1', L: '1', g: '9', G: '6', b: '8', B: '8',
};

export default function GeneratorModal({ open, onOpenChange }: GeneratorModalProps) {
  const { copyToClipboard } = useClipboard();
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [copied, setCopied] = useState(false);
  const [useSeedWord, setUseSeedWord] = useState(false);
  const [seedWord, setSeedWord] = useState('');
  const [options, setOptions] = useState<CharsetOption[]>([
    { id: 'upper', label: 'Uppercase', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', enabled: true, icon: <IconLetterCaseUpper size={16} stroke={1.5} /> },
    { id: 'lower', label: 'Lowercase', chars: 'abcdefghijklmnopqrstuvwxyz', enabled: true, icon: <IconLetterCase size={16} stroke={1.5} /> },
    { id: 'numbers', label: 'Numbers', chars: '0123456789', enabled: true, icon: <IconHash size={16} stroke={1.5} /> },
    { id: 'symbols', label: 'Symbols', chars: '!@#$%^&*()_+~`|}{[]:;?><,./-=', enabled: true, icon: <IconAt size={16} stroke={1.5} /> },
  ]);

  const toggleOption = (id: string) => {
    setOptions(prev => {
      const next = prev.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o);
      // Prevent disabling all options
      if (next.filter(o => o.enabled).length === 0) return prev;
      return next;
    });
  };

  const leetify = (word: string): string => {
    return word.split('').map(ch => {
      if (LEET_MAP[ch] && secureChance(0.6)) return LEET_MAP[ch];
      if (secureChance(0.5)) return ch.toUpperCase();
      return ch;
    }).join('');
  };

  const generate = useCallback(() => {
    const enabledSets = options.filter(o => o.enabled);
    const charset = enabledSets.map(o => o.chars).join('');
    if (!charset) return;

    if (useSeedWord && seedWord.trim()) {
      const seed = seedWord.trim();
      const transformed = leetify(seed);

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
      const guaranteed = enabledSets.map(o => securePickFromString(o.chars));
      const remaining = length - guaranteed.length;
      for (let i = 0; i < remaining; i++) guaranteed.push(securePickFromString(charset));
      secureShuffle(guaranteed);
      setPassword(guaranteed.join(''));
    }

    setCopied(false);
  }, [options, length, useSeedWord, seedWord]);

  // Regenerate whenever deps change or modal opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) generate();
  }, [open, generate]);

  const handleCopy = async () => {
    await copyToClipboard(password, 'Password copied to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand border border-brand/20">
              <IconShieldLock size={16} />
            </div>
            Password Generator
          </DialogTitle>
          <DialogDescription>
            Customize and generate a secure password instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6">
          {/* Password Output */}
          <div className="relative">
            <Input
              readOnly
              value={password}
              className="h-14 text-lg font-mono tracking-widest text-brand bg-[#0A0A0A] border-brand/20 pr-24 text-center"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={generate}
                className="h-10 w-10 text-muted-foreground hover:text-brand hover:bg-brand/10"
                title="Regenerate"
              >
                <IconRefresh size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className={cn(
                  "h-10 w-10 transition-colors",
                  copied
                    ? "text-green-400 hover:bg-green-500/10"
                    : "text-muted-foreground hover:text-brand hover:bg-brand/10"
                )}
                title={copied ? "Copied!" : "Copy"}
              >
                {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              </Button>
            </div>
          </div>

          {/* Length Slider */}
          <div className="space-y-3 lg:space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Length</span>
              <span className="text-sm font-mono text-brand font-bold w-8 text-right">{length}</span>
            </div>
            <input
              type="range"
              min="4"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/50 font-mono">
              <span>4</span>
              <span>64</span>
            </div>
          </div>

          {/* Charset Toggles */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Include</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={cn(
                    "rounded-md relative flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide border transition-all duration-150",
                    opt.enabled
                      ? "bg-brand/10 border-brand/40 text-brand"
                      : "bg-transparent border-border/30 text-muted-foreground hover:border-border/60"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center transition-colors",
                    opt.enabled ? "text-brand" : "text-muted-foreground/50"
                  )}>
                    {opt.icon}
                  </span>
                  <span className="flex-1 text-left">{opt.label}</span>
                  <span className={cn(
                    "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors",
                    opt.enabled ? "border-brand bg-brand/20" : "border-muted-foreground/30"
                  )}>
                    {opt.enabled && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Seed Word Toggle */}
          <div className="space-y-3 lg:space-y-5 pt-2 border-t border-border/30">
            <button
              onClick={() => setUseSeedWord(!useSeedWord)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                <IconSend size={16} className={useSeedWord ? "text-brand" : "text-muted-foreground/50"} />
                <div className="text-left">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Seed Word</span>
                  <span className="text-[10px] text-muted-foreground/60">Embed a word into the password with leet substitutions</span>
                </div>
              </div>
              <div className={cn(
                "w-9 h-5 rounded-full flex items-center transition-colors px-0.5",
                useSeedWord ? "bg-brand/80 justify-end" : "bg-muted justify-start"
              )}>
                <span className={cn(
                  "w-4 h-4 rounded-full transition-colors shadow-sm",
                  useSeedWord ? "bg-white" : "bg-muted-foreground/40"
                )} />
              </div>
            </button>

            {useSeedWord && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  value={seedWord}
                  onChange={(e) => setSeedWord(e.target.value)}
                  placeholder="e.g. Tom, coffee, guitar"
                  className="bg-[#0A0A0A] border-border/40 text-sm"
                  maxLength={length}
                />
                <p className="text-[10px] text-muted-foreground/50 mt-2">
                  Letters are auto-substituted: a→@, e→3, s→$, o→0, t→+, etc.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
