import { MnemonicTab } from './MnemonicTab';
import { PassphraseTab } from './PassphraseTab';
import { PatternTab } from './PatternTab';
import { PhoneticTab } from './PhoneticTab';
import { StandardTab } from './StandardTab';

interface GeneratorTabsProps {
  activeMode: string;
  onUsePassword?: (password: string) => void;
}

export function GeneratorTabs({ activeMode, onUsePassword }: GeneratorTabsProps) {
  return (
    <>
      {activeMode === 'standard' && <StandardTab onUsePassword={onUsePassword} />}
      {activeMode === 'passphrase' && <PassphraseTab onUsePassword={onUsePassword} />}
      {activeMode === 'pattern' && <PatternTab onUsePassword={onUsePassword} />}
      {activeMode === 'mnemonic' && <MnemonicTab onUsePassword={onUsePassword} />}
      {activeMode === 'phonetic' && <PhoneticTab onUsePassword={onUsePassword} />}
    </>
  );
}
