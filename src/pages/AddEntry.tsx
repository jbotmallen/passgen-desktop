import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconArrowLeft, IconDeviceFloppy, IconLoader2, IconUser, IconWorld, IconLock, IconFileDescription, IconCursorText } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import PasswordCriteria from '@/components/PasswordCriteria';
import CircuitLines from '@/components/CircuitLines';
import { AutoLockHandler } from '@/components/AutoLockHandler';
import { GeneratorPanel } from '@/components/generator/GeneratorPanel';
import { MODES } from '@/components/generator/constants';
import { decryptEntryField, getEntryForEdit, saveEntry } from '@/lib/backend';
import { logError } from '@/utils/logger';
import { z } from 'zod';
import { entryFormSchema, type EntryFormOutput } from '@/lib/schemas/entry';
import { LIMITS } from '@/utils/sanitize';
import { cn } from '@/lib/utils';

interface EntryRow {
  id: string;
  title: string;
  username?: string | null;
  website_url?: string | null;
}

type EntryFormValues = z.input<typeof entryFormSchema>;

const DEFAULT_VALUES: EntryFormValues = {
  title: '',
  username: '',
  url: '',
  password: '',
  notes: '',
};

export default function AddEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const vaultId = location.state?.vaultId;
  const entryId: string | undefined = location.state?.entryId;

  const [loadingEntry, setLoadingEntry] = useState<boolean>(!!entryId);
  const [activeSheet, setActiveSheet] = useState<'entry' | 'generator'>('entry');
  const [activeMode, setActiveMode] = useState('standard');
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(entryFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const password = useWatch({ control, name: 'password' });
  const notes = useWatch({ control, name: 'notes' });

  useEffect(() => {
    if (!entryId) return;
    let cancelled = false;

    (async () => {
      try {
        const row: EntryRow | null = await getEntryForEdit(vaultId, entryId);
        if (!row || cancelled) return;

        let plainPassword = '';
        let plainNotes = '';

        const pwRes = await decryptEntryField(vaultId, entryId, 'password');
        if (pwRes.success && pwRes.data) plainPassword = pwRes.data;
        const noteRes = await decryptEntryField(vaultId, entryId, 'notes');
        if (noteRes.success && noteRes.data) plainNotes = noteRes.data;

        if (cancelled) return;
        reset({
          title: row.title || '',
          username: row.username || '',
          url: row.website_url || '',
          password: plainPassword,
          notes: plainNotes,
        });
      } catch (e) {
        logError('Failed to load entry for edit', e);
        toast.error('Failed to load entry. Vault may be locked.');
      } finally {
        if (!cancelled) setLoadingEntry(false);
      }
    })();

    return () => { cancelled = true; };
  }, [entryId, reset, vaultId]);

  const onSubmit = handleSubmit(async (raw) => {
    if (!vaultId) {
      toast.error('No vault selected');
      return;
    }

    // Resolver already transformed values, but re-parse defensively.
    const parsed = entryFormSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid form');
      return;
    }
    const clean: EntryFormOutput = parsed.data;

    setSaving(true);
    try {
      if (entryId) {
        await saveEntry({
          vaultId,
          entryId,
          title: clean.title,
          username: clean.username || null,
          url: clean.url || null,
          password: clean.password,
          notes: clean.notes || null,
        });
        toast.success('Entry updated');
        navigate('/dashboard', { state: { vaultId, newEntryId: entryId }, replace: true });
      } else {
        const id = await saveEntry({
          vaultId,
          title: clean.title,
          username: clean.username || null,
          url: clean.url || null,
          password: clean.password,
          notes: clean.notes || null,
        });
        toast.success('Entry saved');
        navigate('/dashboard', { state: { vaultId, newEntryId: id }, replace: true });
      }
    } catch (e) {
      logError('Failed to save entry', e);
      toast.error('Failed to save entry. Vault may be locked.');
    } finally {
      setSaving(false);
    }
  });

  const useGeneratedPassword = (generatedPassword: string) => {
    setValue('password', generatedPassword, { shouldValidate: true, shouldDirty: true });
    setActiveSheet('entry');
  };

  const isBusy = saving || isSubmitting;

  return (
    <form
      onSubmit={onSubmit}
      className="flex h-screen min-h-[500px] w-full flex-col overflow-hidden bg-[#111111] text-foreground"
    >
      <CircuitLines />
      {vaultId && <AutoLockHandler vaultId={vaultId} />}

      <div className="z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border/30 px-4 py-4 sm:px-6 lg:px-8 pb-2">
        <button type="button" onClick={() => !isBusy && navigate(-1)} disabled={isBusy} className={cn('group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground', isBusy && 'opacity-50 cursor-not-allowed')}>
          <IconArrowLeft size={18} className={cn('transition-transform', !isBusy && 'group-hover:-translate-x-1')} />
          <span className="text-sm font-medium">Back to vault</span>
        </button>
        <a href="/welcome" onClick={(e) => { e.preventDefault(); if (!isBusy) navigate('/welcome'); }} className={cn('flex items-center gap-2 group', isBusy && 'opacity-50 cursor-not-allowed')}>
          <img src="/logo.png" alt="Pass Gen" className="h-6 w-6 transition-all group-hover:drop-shadow-[0_0_8px_rgba(245,197,99,0.4)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-foreground">Pass Gen</span>
        </a>
        <Button type="submit" disabled={isBusy || loadingEntry} className="shrink-0 gap-2">
          {isBusy ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
          {isBusy ? 'Saving…' : (entryId ? 'Update Entry' : 'Save Entry')}
        </Button>
      </div>

      <div className="z-20 shrink-0 border-b border-border/20 lg:hidden pb-2">
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border/30 bg-[#0A0A0A]">
          <button
            type="button"
            onClick={() => setActiveSheet('entry')}
            className={cn('h-10 text-xs font-bold uppercase tracking-wider transition-colors', activeSheet === 'entry' ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:text-foreground')}
          >
            Entry Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet('generator')}
            className={cn('h-10 border-l border-border/30 text-xs font-bold uppercase tracking-wider transition-colors', activeSheet === 'generator' ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:text-foreground')}
          >
            Generate Password
          </button>
        </div>
      </div>

      <div className="z-10 grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={cn('min-w-0 overflow-y-auto sm:p-6 sm:pt-0 lg:block lg:border-r lg:border-border/20 lg:p-8', activeSheet === 'entry' ? 'block' : 'hidden')}>
          <h1 className="mb-1 text-xl font-bold text-foreground">{entryId ? 'Edit Entry' : 'New Entry'}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{entryId ? 'Update the details for this credential.' : 'Fill in the details for this credential.'}</p>

          <div className="w-full space-y-3 lg:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="entry-title">Title</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <IconCursorText size={16} />
                </div>
                <Input
                  id="entry-title"
                  {...register('title')}
                  placeholder="e.g. GitHub, Netflix"
                  className={cn('pl-10', errors.title && 'border-red-500 focus-visible:ring-red-500')}
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'entry-title-error' : undefined}
                  maxLength={LIMITS.TITLE_MAX}
                />
              </div>
              {errors.title?.message && (
                <p id="entry-title-error" className="text-xs text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-user">Username / Email</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <IconUser size={16} />
                </div>
                <Input
                  id="entry-user"
                  {...register('username')}
                  placeholder="john.doe@example.com"
                  className={cn('pl-10', errors.username && 'border-red-500 focus-visible:ring-red-500')}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'entry-user-error' : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={LIMITS.EMAIL_MAX}
                />
              </div>
              {errors.username?.message && (
                <p id="entry-user-error" className="text-xs text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-url">Website URL</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <IconWorld size={16} />
                </div>
                <Input
                  id="entry-url"
                  {...register('url')}
                  placeholder="https://example.com"
                  className={cn('pl-10', errors.url && 'border-red-500 focus-visible:ring-red-500')}
                  aria-invalid={!!errors.url}
                  aria-describedby={errors.url ? 'entry-url-error' : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={LIMITS.URL_MAX}
                />
              </div>
              {errors.url?.message && (
                <p id="entry-url-error" className="text-xs text-red-400">{errors.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-pw">Password</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
                  <IconLock size={16} />
                </div>
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <PasswordInput
                      id="entry-pw"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      placeholder="Enter or generate a password"
                      className={cn('pl-10', errors.password && 'border-red-500 focus-visible:ring-red-500')}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'entry-pw-error' : undefined}
                      maxLength={LIMITS.ENTRY_PASSWORD_MAX}
                    />
                  )}
                />
              </div>
              {errors.password?.message && (
                <p id="entry-pw-error" className="text-xs text-red-400">{errors.password.message}</p>
              )}
              <PasswordCriteria password={password} className="mt-3" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-notes">Notes</Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground pointer-events-none">
                  <IconFileDescription size={16} />
                </div>
                <textarea
                  id="entry-notes"
                  {...register('notes')}
                  rows={3}
                  maxLength={LIMITS.NOTES_MAX}
                  aria-invalid={!!errors.notes}
                  aria-describedby={errors.notes ? 'entry-notes-error' : undefined}
                  className={cn(
                    'flex w-full rounded-md min-h-24 border border-input bg-transparent py-2 pr-3 pl-10 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    errors.notes && 'border-red-500 focus-visible:ring-red-500',
                  )}
                  placeholder="Additional details..."
                />
              </div>
              <div className="flex items-center justify-between">
                {errors.notes?.message ? (
                  <p id="entry-notes-error" className="text-xs text-red-400">{errors.notes.message}</p>
                ) : <span />}
                <span className="text-xs text-muted-foreground">{(notes ?? '').length}/{LIMITS.NOTES_MAX}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('min-w-0 overflow-hidden px-4 py-2 sm:p-6 sm:pt-0 lg:flex lg:flex-col', activeSheet === 'generator' ? 'flex flex-col' : 'hidden')}>
          <div className="mb-6 flex shrink-0 items-end justify-between gap-4">
            <div>
              <h2 className="mb-1 text-xl font-bold text-foreground">Generate Password</h2>
              <p className="text-sm text-muted-foreground">Generate a secure password and click <span className="text-brand">→</span> to use it.</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid auto-cols-max grid-flow-col gap-1 overflow-x-auto rounded-md border border-border/30 bg-[#0A0A0A] p-1 lg:grid-flow-row lg:grid-cols-5">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveMode(mode.id)}
                  className={cn(
                    'flex h-10 shrink-0 items-center justify-center gap-2 rounded px-3 text-xs font-bold uppercase tracking-wider transition-colors',
                    activeMode === mode.id ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="shrink-0">{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
            <GeneratorPanel activeMode={activeMode} onUsePassword={useGeneratedPassword} />
          </div>
        </div>
      </div>
    </form>
  );
}
