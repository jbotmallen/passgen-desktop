import { useState } from 'react';
import { IconCheck, IconCopy, IconRefresh, IconSend } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useClipboard } from '@/utils/hooks';

interface PasswordDisplayProps {
  password: string;
  onRegenerate: () => void;
  onUsePassword?: (password: string) => void;
}

export function PasswordDisplay({ password, onRegenerate, onUsePassword }: PasswordDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { copyToClipboard } = useClipboard();

  const copy = async () => {
    await copyToClipboard(password, 'Password copied and will be cleared in 30s.');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mb-3">
      <Input
        readOnly
        value={password}
        className={cn(
          'h-12 text-base font-mono tracking-widest text-brand bg-[#0A0A0A] border-brand/20 text-center',
          onUsePassword ? 'pr-28' : 'pr-20',
        )}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        <Button variant="ghost" size="icon" onClick={onRegenerate} className="h-9 w-9 text-muted-foreground hover:text-brand hover:bg-brand/10" title="Regenerate">
          <IconRefresh size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={copy}
          className={cn('h-9 w-9 transition-colors', copied ? 'text-green-400 hover:bg-green-500/10' : 'text-muted-foreground hover:text-brand hover:bg-brand/10')}
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
        </Button>
        {onUsePassword && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUsePassword(password)}
            className="h-9 w-9 text-muted-foreground hover:text-brand hover:bg-brand/10"
            title="Use this password"
          >
            <IconSend size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
