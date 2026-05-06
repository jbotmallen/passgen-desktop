import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { pick } from '@/utils/helpers';
import { ADJECTIVES, NOUNS, VERBS } from './constants';
import { PasswordDisplay } from './PasswordDisplay';
import { Toggle } from './Toggle';

const SYMBOLS = ['!', '@', '#', '$', '%', '&', '*'];
const TOKEN_PATTERN = /[A-Za-z0-9]+|[^A-Za-z0-9\s]/g;

function capitalizeToken(token: string) {
  if (!/[A-Za-z]/.test(token)) return token;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function sanitizeMnemonicInput(value: string) {
  const sanitized = (value.match(TOKEN_PATTERN) ?? []).map(capitalizeToken).join(' ');
  return /\s$/.test(value) && sanitized ? `${sanitized} ` : sanitized;
}

function getMnemonicPassword(sentenceValue: string) {
  return (sentenceValue.match(TOKEN_PATTERN) ?? [])
    .map(token => (/^[A-Za-z0-9]+$/.test(token) ? token[0] : token))
    .join('');
}

interface MnemonicTabProps {
  onUsePassword?: (password: string) => void;
}

export function MnemonicTab({ onUsePassword }: MnemonicTabProps) {
  const [password, setPassword] = useState('');
  const [sentence, setSentence] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [wordCount, setWordCount] = useState(5);

  const generate = useCallback(() => {
    const pools = [ADJECTIVES, NOUNS, VERBS];
    const words = Array.from({ length: wordCount }, (_, i) => capitalizeToken(pick(pools[i % pools.length])));
    const sym = pick(SYMBOLS);
    const sentenceValue = `${words.join(' ')} ${sym}`;
    setSentence(sentenceValue);
    setPassword(getMnemonicPassword(sentenceValue));
  }, [wordCount]);

  const updateManualSentence = useCallback((value: string) => {
    const sentenceValue = sanitizeMnemonicInput(value);
    setSentence(sentenceValue);
    setPassword(getMnemonicPassword(sentenceValue));
  }, []);

  useEffect(() => {
    if (autoGenerate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      generate();
    }
  }, [autoGenerate, generate]);

  return (
    <div className="space-y-3 lg:space-y-5">
      <PasswordDisplay password={password} onRegenerate={autoGenerate ? generate : () => updateManualSentence(sentence)} onUsePassword={onUsePassword} />

      <div className="space-y-3 lg:space-y-5 pt-3 border-t border-border/20">
        <Toggle label="Auto Generate" value={autoGenerate} onChange={() => setAutoGenerate(!autoGenerate)} sub="Switch off to write your own mnemonic sentence" />

        {autoGenerate ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Words</span>
              <span className="text-sm font-mono text-brand font-bold">{wordCount}</span>
            </div>
            <input type="range" min="3" max="12" value={wordCount} onChange={(e) => setWordCount(parseInt(e.target.value))} className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand" />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <Input value={sentence} onChange={(e) => updateManualSentence(e.target.value)} placeholder="e.g. Quiet river opens 27 gates !" className="bg-[#0A0A0A] border-border/40 text-sm" maxLength={128} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Remember This Sentence</span>
        <div className="bg-[#0A0A0A] border border-border/30 rounded-md p-4">
          <p className="text-base text-foreground/90 leading-relaxed">
            {(sentence.match(TOKEN_PATTERN) ?? []).map((word, i, words) => {
              const isSymbol = !/^[A-Za-z0-9]+$/.test(word);
              return (
                <span key={i}>
                  <span className="text-brand font-bold text-lg">{isSymbol ? word : word[0]}</span>
                  {!isSymbol && <span>{word.slice(1)}</span>}
                  {i < words.length - 1 && ' '}
                </span>
              );
            })}
          </p>
        </div>
        <p className="text-xs text-muted-foreground/50">Type only the <span className="text-brand">gold letters</span>. They form your password. Hit refresh to get a new phrase.</p>
      </div>
    </div>
  );
}
