import { IconLogout } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LockVaultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLock: () => void;
}

export function LockVaultDialog({ open, onOpenChange, onConfirmLock }: LockVaultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
              <IconLogout size={18} />
            </div>
            Lock vault?
          </DialogTitle>
          <DialogDescription className="pt-1">
            Your vault will be locked and all decrypted data will be cleared from memory. You'll need to re-enter your master password to access it again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => { onOpenChange(false); onConfirmLock(); }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Lock vault
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

