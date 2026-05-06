import { useCallback, useEffect, useState } from 'react';
import { pick } from '@/utils/helpers';
import { secureChance, securePickFromString, secureRangeInclusive } from '@/utils/secureRandom';
import { PasswordDisplay } from './PasswordDisplay';

const CONSONANTS = 'bcdfghjklmnprstvwxz';
const VOWELS = 'aeiou';

interface PhoneticTabProps {
  onUsePassword?: (password: string) => void;
}

export function PhoneticTab({ onUsePassword }: PhoneticTabProps) {
  const [password, setPassword] = useState('');
  const [syllables, setSyllables] = useState(4);

  const generate = useCallback(() => {
    let result = '';
    for (let i = 0; i < syllables; i++) {
      const c = securePickFromString(CONSONANTS);
      const v = securePickFromString(VOWELS);
      const c2 = secureChance(0.5) ? securePickFromString(CONSONANTS) : '';
      result += i === 0 ? c.toUpperCase() + v + c2 : c + v + c2;
    }
    result += secureRangeInclusive(10, 99) + pick(['!', '@', '#', '$', '%', '&', '*']);
    setPassword(result);
  }, [syllables]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generate();
  }, [generate]);

  return (
    <div className="space-y-3 lg:space-y-5">
      <PasswordDisplay password={password} onRegenerate={generate} onUsePassword={onUsePassword} />

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Syllables</span>
          <span className="text-sm font-mono text-brand font-bold">{syllables}</span>
        </div>
        <input type="range" min="2" max="8" value={syllables} onChange={(e) => setSyllables(parseInt(e.target.value))} className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand" />
        <p className="text-xs text-muted-foreground/50">More syllables = longer, more memorable word. A number and symbol are always appended.</p>
      </div>
    </div>
  );
}
