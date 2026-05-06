import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { pick } from '@/utils/helpers';
import { secureRangeInclusive } from '@/utils/secureRandom';
import { SEPARATORS, WORD_LIST } from './constants';
import { PasswordDisplay } from './PasswordDisplay';
import { Toggle } from './Toggle';

interface PassphraseTabProps {
  onUsePassword?: (password: string) => void;
}

export function PassphraseTab({ onUsePassword }: PassphraseTabProps) {
  const [password, setPassword] = useState('');
  const [wordCount, setWordCount] = useState(4);
  const [capitalize, setCapitalize] = useState(true);
  const [addNumber, setAddNumber] = useState(true);
  const [separator, setSeparator] = useState('-');

  const generate = useCallback(() => {
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      let word = pick(WORD_LIST);
      if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
      words.push(word);
    }
    let result = words.join(separator);
    if (addNumber) result += separator + secureRangeInclusive(100, 999);
    setPassword(result);
  }, [wordCount, capitalize, addNumber, separator]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  }, [generate]);

  return (
    <div className="space-y-3 lg:space-y-5">
      <PasswordDisplay password={password} onRegenerate={generate} onUsePassword={onUsePassword} />

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Words</span>
          <span className="text-sm font-mono text-brand font-bold">{wordCount}</span>
        </div>
        <input type="range" min="3" max="8" value={wordCount} onChange={(e) => setWordCount(parseInt(e.target.value))} className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Separator</span>
        <div className="flex gap-2 mt-1">
          {SEPARATORS.map(sep => (
            <button key={sep} onClick={() => setSeparator(sep)} className={cn(
              'rounded-md w-9 h-9 flex items-center justify-center text-sm font-mono border transition-all',
              separator === sep ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-transparent border-border/30 text-muted-foreground hover:border-border/60',
            )}>
              {sep}
            </button>
          ))}
        </div>
      </div>

      <div className="py-3 border-t border-border/20 flex items-center gap-30">
        <Toggle label="Capitalize words" value={capitalize} onChange={() => setCapitalize(!capitalize)} />
        <Toggle label="Append number" value={addNumber} onChange={() => setAddNumber(!addNumber)} />
      </div>
    </div>
  );
}
