import { useState, useEffect } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DeleteEntryDialogProps {
  open: boolean;
  titleToMatch: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteEntryDialog({ open, titleToMatch, onOpenChange, onConfirm }: DeleteEntryDialogProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <IconAlertTriangle size={20} /> Delete Entry
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete this entry from your vault.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-3 lg:space-y-5">
          <p className="text-sm text-foreground">
            Please type <strong className="font-mono text-brand select-all">{titleToMatch}</strong> to confirm.
          </p>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={titleToMatch}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={inputValue !== titleToMatch}
          >
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
