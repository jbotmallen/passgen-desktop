import { useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordCriteria from '@/components/PasswordCriteria';
import { PasswordInput } from '@/components/PasswordInput';
import { AVAILABLE_ICONS } from '@/utils/helpers';
import { LIMITS } from '@/utils/sanitize';
import { z } from 'zod';
import { createVaultSchema, type CreateVaultOutput } from '@/lib/schemas/vault';
import { IconLoader2 } from '@tabler/icons-react';

interface CreateVaultDialogProps {
  open: boolean;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateVault: (values: CreateVaultOutput) => void | Promise<void>;
}

type FormValues = z.input<typeof createVaultSchema>;

const DEFAULTS: FormValues = { name: '', icon: 'shield', password: '' };

export function CreateVaultDialog({
  open,
  isLoading,
  onOpenChange,
  onCreateVault,
}: CreateVaultDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createVaultSchema),
    defaultValues: DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const name = useWatch({ control, name: 'name' });
  const password = useWatch({ control, name: 'password' });
  const busy = isLoading || isSubmitting;

  useEffect(() => {
    if (!open) reset(DEFAULTS);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (data) => {
    await onCreateVault(data as CreateVaultOutput);
  });

  return (
    <Dialog open={open} onOpenChange={(val) => !busy && onOpenChange(val)}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new vault</DialogTitle>
            <DialogDescription>Set a name, icon, and master password for your vault.</DialogDescription>
          </DialogHeader>

          <div className="px-8 py-6 flex flex-col gap-6">
            <div>
              <Label htmlFor="vault-name" className="mb-2 block">Vault Name</Label>
              <div className="relative">
                <Input
                  id="vault-name"
                  {...register('name')}
                  placeholder="Enter vault name"
                  maxLength={LIMITS.VAULT_NAME_MAX}
                  disabled={busy}
                  aria-invalid={!!errors.name}
                  className="pr-14"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {(name ?? '').length}/{LIMITS.VAULT_NAME_MAX}
                </span>
              </div>
              {errors.name?.message && (
                <p className="text-xs text-red-400 mt-2">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Choose an Icon</Label>
              <Controller
                control={control}
                name="icon"
                render={({ field }) => (
                  <div className="grid grid-cols-7 gap-2">
                    {AVAILABLE_ICONS.map(iconOption => (
                      <button
                        type="button"
                        key={iconOption.name}
                        onClick={() => field.onChange(iconOption.name)}
                        disabled={busy}
                        className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${field.value === iconOption.name ? 'border border-brand bg-brand/10 text-brand' : 'border border-transparent text-muted-foreground hover:bg-muted'} ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <iconOption.component size={20} stroke={1.5} />
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.icon?.message && (
                <p className="text-xs text-red-400 mt-2">{errors.icon.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="vault-password" className="mb-2 block">Master Password</Label>
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <PasswordInput
                    id="vault-password"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={busy}
                    placeholder="Create a strong master password"
                    maxLength={LIMITS.MASTER_PASSWORD_MAX}
                    aria-invalid={!!errors.password}
                  />
                )}
              />
              {errors.password?.message && (
                <p className="text-xs text-red-400 mt-2">{errors.password.message}</p>
              )}
              <PasswordCriteria password={password} className="mt-4" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy && <IconLoader2 size={16} className="animate-spin mr-2" />}
              {busy ? 'Creating...' : 'Create Vault'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
