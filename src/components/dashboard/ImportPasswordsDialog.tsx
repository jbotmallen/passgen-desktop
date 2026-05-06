import { useState } from 'react';
import { IconAlertTriangle, IconCheck, IconUpload, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { importLegacyPasswords, parseLegacyJson, type ImportSummary } from '@/lib/importer';
import { logError } from '@/utils/logger';

interface ImportPasswordsDialogProps {
  open: boolean;
  vaultId: string | null;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type Phase = 'idle' | 'working' | 'done' | 'error';

export function ImportPasswordsDialog({ open, vaultId, onOpenChange, onImported }: ImportPasswordsDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const reset = () => {
    setPhase('idle');
    setSummary(null);
    setErrorMessage('');
  };

  const handlePickAndImport = async () => {
    if (!vaultId) {
      toast.error('No vault selected');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setPhase('working');
        setErrorMessage('');
        setSummary(null);

        const text = await file.text();
        const blocks = parseLegacyJson(text);
        const result = await importLegacyPasswords(vaultId, blocks);

        setSummary(result);
        setPhase('done');
        onImported();

        if (result.imported > 0) {
          toast.success(`Imported ${result.imported} entries`);
        } else {
          toast.warning('No entries imported');
        }
      } catch (error) {
        logError('Import failed', error);
        setErrorMessage((error as Error).message || 'Import failed');
        setPhase('error');
      }
    };
    input.click();
  };

  const handleClose = (next: boolean) => {
    if (phase === 'working') return;
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => phase !== 'working' && handleClose(val)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUpload size={18} className="text-brand" />
            Import passwords from JSON
          </DialogTitle>
          <DialogDescription>
            Pick a legacy Pass Gen export. Each password is encrypted with this vault&apos;s key before being saved. The file is never sent anywhere.
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6 flex flex-col gap-4 text-sm">
          {phase === 'idle' && (
            <p className="text-muted-foreground">
              Expected shape: an array of <code className="font-mono text-brand">{'{ email, username, passwords: [...] }'}</code> blocks.
              Entries with missing or redacted passwords are skipped.
            </p>
          )}

          {phase === 'working' && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <IconLoader2 size={18} className="animate-spin text-brand" />
              <span>Encrypting and saving entries…</span>
            </div>
          )}

          {phase === 'done' && summary && (
            <div className="space-y-3 lg:space-y-5">
              <div className="flex items-center gap-2 text-green-400">
                <IconCheck size={18} />
                <span className="font-semibold">{summary.imported} entries imported</span>
              </div>
              {summary.skipped > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <IconAlertTriangle size={16} />
                    <span>{summary.skipped} skipped</span>
                  </div>
                  <ul className="max-h-40 overflow-y-auto rounded-md border border-border/40 bg-[#0A0A0A] p-2 text-xs text-muted-foreground">
                    {summary.skippedReasons.slice(0, 50).map((reason, i) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {phase === 'error' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-destructive">
              <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)} disabled={phase === 'working'}>
            {phase === 'done' || phase === 'error' ? 'Close' : 'Cancel'}
          </Button>
          {(phase === 'idle' || phase === 'error') && (
            <Button onClick={handlePickAndImport} disabled={!vaultId}>
              <IconUpload size={16} /> Choose JSON
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
