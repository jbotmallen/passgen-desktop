import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { renderVaultIcon } from '@/utils/helpers';
import { LIMITS } from '@/utils/sanitize';
import { z } from 'zod';
import { unlockVaultSchema, type UnlockVaultOutput } from '@/lib/schemas/vault';
import { IconLoader2 } from '@tabler/icons-react';
import type { Vault } from '@/utils/types';

interface UnlockVaultDialogProps {
  open: boolean;
  selectedVault: Vault | null;
  error: string;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: (values: UnlockVaultOutput) => void | Promise<void>;
}

type FormValues = z.input<typeof unlockVaultSchema>;

export function UnlockVaultDialog({
  open,
  selectedVault,
  error,
  isLoading,
  onOpenChange,
  onUnlock,
}: UnlockVaultDialogProps) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(unlockVaultSchema),
    defaultValues: { password: '' } satisfies FormValues,
    mode: 'onSubmit',
  });

  const busy = isLoading || isSubmitting;

  useEffect(() => {
    if (!open) reset({ password: '' });
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    await onUnlock(data as UnlockVaultOutput);
  });

  const fieldError = errors.password?.message;

  return (
    <Dialog open={open} onOpenChange={(val) => !busy && onOpenChange(val)}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Unlock {selectedVault?.name}</DialogTitle>
            <DialogDescription>Enter your master password to access this vault.</DialogDescription>
          </DialogHeader>

          <div className="px-8 py-6 flex flex-col gap-6 items-center">
            {selectedVault && (
              <div className="w-24 h-24 rounded-full border border-brand/20 flex items-center justify-center">
                {renderVaultIcon(selectedVault.icon, 40, 1.5, 'text-brand')}
              </div>
            )}

            <div className="w-full text-left">
              <Label htmlFor="unlock-password" className="mb-2 block ml-1">Master Password</Label>
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <PasswordInput
                    id="unlock-password"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="Enter your master password"
                    autoFocus
                    disabled={busy}
                    maxLength={LIMITS.MASTER_PASSWORD_MAX}
                    aria-invalid={!!fieldError || !!error}
                    className={(fieldError || error) ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                )}
              />
              {fieldError && <p className="text-xs text-destructive mt-2 text-center">{fieldError}</p>}
              {!fieldError && error && <p className="text-xs text-destructive mt-2 text-center">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy && <IconLoader2 size={16} className="animate-spin mr-2" />}
              {busy ? 'Unlocking...' : 'Unlock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
