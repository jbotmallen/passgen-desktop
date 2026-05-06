import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconHistory,
  IconPlus,
  IconShieldCheck,
  IconStar,
  IconStarFilled,
  IconTag,
  IconX,
  IconClipboardCheck,
} from '@tabler/icons-react';
import { renderEntryIcon } from '@/utils/helpers';
import type { Entry } from '@/utils/types';
import { useClipboard } from '@/utils/hooks';
import { tagSchema, LIMITS } from '@/utils/sanitize';
import { toast } from 'sonner';

interface EntryDetailsPaneProps {
  selectedEntry: Entry | null;
  showPassword: boolean;
  onTogglePassword: () => void;
  onToggleFavorite: (entryId: string) => void;
  onUpdateTags: (entryId: string, tags: string[]) => void;
  onEditEntry: () => void;
  clipboardClearDelay?: number;
}

function safeUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

function parseTags(tags?: string): string[] {
  if (!tags) return [];
  try { return JSON.parse(tags); }
  catch { return tags.split(',').map(t => t.trim()).filter(Boolean); }
}

function CopyButton({ onCopy, size = 16, className = "text-muted-foreground hover:text-foreground transition-colors" }: { onCopy: () => void, size?: number, className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (copied) return;
    onCopy();
    setCopied(true);
    setTimeout(() => {
      // Need to use functional state update or ensure it doesn't leak, but a simple timeout is fine here
      // especially since the component will unmount if the entry changes (due to key)
      setCopied(false);
    }, 3000);
  };

  return (
    <button onClick={handleClick} disabled={copied} className={`${className} ${copied ? 'opacity-100 cursor-default' : ''}`}>
      {copied ? <IconClipboardCheck size={size} className="text-brand" /> : <IconCopy size={size} />}
    </button>
  );
}

export function EntryDetailsPane({
  selectedEntry,
  showPassword,
  onTogglePassword,
  onToggleFavorite,
  onUpdateTags,
  onEditEntry,
  clipboardClearDelay = 30000,
}: EntryDetailsPaneProps) {
  const { copyToClipboard } = useClipboard(clipboardClearDelay);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const entryTags = parseTags(selectedEntry?.tags);

  const handleAddTag = () => {
    if (!selectedEntry) return;
    const result = tagSchema.safeParse(newTag);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Invalid tag');
      return;
    }
    const cleaned = result.data;
    if (entryTags.includes(cleaned)) {
      setNewTag('');
      return;
    }
    onUpdateTags(selectedEntry.id, [...entryTags, cleaned]);
    setNewTag('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedEntry) return;
    onUpdateTags(selectedEntry.id, entryTags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTag('');
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#151515] overflow-y-auto">
      {selectedEntry ? (
        <div className="max-w-5xl w-full mx-auto p-6 animate-in fade-in duration-300">
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#1A1A1A] border border-border/50 rounded-lg flex items-center justify-center text-foreground shadow-sm">
                {renderEntryIcon(selectedEntry.icon, 28)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold text-foreground">{selectedEntry.title}</h2>
                  <button
                    onClick={() => onToggleFavorite(selectedEntry.id)}
                    className={`p-1 rounded-md transition-all ${selectedEntry.is_favorite
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-muted-foreground/30 hover:text-amber-400'
                      }`}
                    title={selectedEntry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {selectedEntry.is_favorite
                      ? <IconStarFilled size={20} />
                      : <IconStar size={20} />
                    }
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedEntry.category || 'Login'}
                  {selectedEntry.updated_at && (
                    <><span className="mx-2">•</span>Updated {new Date(selectedEntry.updated_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-3 lg:space-y-5">
              <button disabled className="flex items-center gap-2 px-4 py-2 rounded-md bg-transparent border border-border/50 text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                <IconHistory size={16} /> History
                <span className="text-[9px] font-bold uppercase tracking-wider bg-muted/20 px-1.5 py-0.5 rounded ml-1">Soon</span>
              </button>
              <button onClick={onEditEntry} className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-[#111111] font-semibold text-sm hover:bg-brand-hover transition-colors shadow-sm">
                <IconEdit size={16} /> Edit
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider block mb-2 uppercase">Username / Email</label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{selectedEntry.username}</span>
                  <CopyButton key={`copy-user-${selectedEntry.id}`} onCopy={() => selectedEntry.username && copyToClipboard(selectedEntry.username, 'Username copied to clipboard')} size={16} />
                </div>
              </div>
              <div className="flex-1 bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider block mb-2 uppercase">Website</label>
                <div className="flex items-center justify-between">
                  {(() => {
                    const safeHref = safeUrl(selectedEntry.website_url);
                    return safeHref ? (
                      <>
                        <a href={safeHref} target="_blank" rel="noreferrer noopener" className="text-sm font-medium text-brand hover:underline truncate">
                          {selectedEntry.website_url}
                        </a>
                        <a href={safeHref} target="_blank" rel="noreferrer noopener" className="text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
                          <IconExternalLink size={16} />
                        </a>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground truncate" title="Invalid or unsupported URL scheme">
                        {selectedEntry.website_url || '—'}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider block uppercase">Password</label>
                <span className="text-[10px] font-bold text-brand uppercase">{selectedEntry.strength}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-mono text-foreground tracking-widest leading-none translate-y-1">
                  {showPassword ? (selectedEntry.password || '••••••••••••••••') : '••••••••••••••••'}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={onTogglePassword} className="text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                  <CopyButton key={`copy-pass-${selectedEntry.id}`} onCopy={() => selectedEntry.password && copyToClipboard(selectedEntry.password)} size={18} />
                </div>
              </div>
            </div>

            {selectedEntry.totp && (
              <div className="bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider block mb-3 uppercase">One-Time Password (TOTP)</label>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-mono text-foreground font-bold tracking-[0.3em]">{selectedEntry.totp}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
                    <CopyButton key={`copy-totp-${selectedEntry.id}`} onCopy={() => selectedEntry.totp && copyToClipboard(selectedEntry.totp, 'TOTP copied to clipboard')} size={18} />
                  </div>
                </div>
              </div>
            )}

            {selectedEntry.notes && (
              <div className="bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider block mb-3 uppercase">Secure Notes</label>
                <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                  {selectedEntry.notes}
                </div>
              </div>
            )}

            {/* Tags Section */}
            <div className="bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconTag size={14} className="text-muted-foreground" />
                  <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Tags</label>
                </div>
                {!isAddingTag && (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors"
                  >
                    <IconPlus size={12} /> Add
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {entryTags.map(tag => (
                  <span
                    key={tag}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand/5 border border-brand/15 text-xs text-brand font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <IconX size={10} />
                    </button>
                  </span>
                ))}
                {isAddingTag && (
                  <div className="inline-flex items-center gap-1 rounded-md border border-brand/30 bg-brand/5 px-1.5 h-7">
                    <Input
                      type="text"
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => { if (!newTag.trim()) setIsAddingTag(false); }}
                      placeholder="tag name"
                      maxLength={LIMITS.TAG_MAX}
                      className="bg-transparent text-xs text-brand placeholder:text-brand/30 outline-none w-24 h-full border-none px-1 shadow-none focus-visible:ring-0"
                      autoFocus
                    />
                  </div>
                )}
                {entryTags.length === 0 && !isAddingTag && (
                  <p className="text-xs text-muted-foreground/50">No tags yet</p>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg border border-border/20">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1A1A1A] border border-border/50 text-muted-foreground px-2.5 py-1 rounded-md shadow-sm">Custom Fields Coming Soon</span>
              </div>
              <div className="flex gap-4 opacity-40 pointer-events-none select-none">
                <div className="flex-1 bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-wider block mb-2 uppercase">Custom Fields</label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Routing Num</span>
                      <span className="text-sm font-mono text-foreground tracking-widest translate-y-0.5">••••••••</span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><IconCopy size={16} /></button>
                  </div>
                </div>
                <div className="flex-1 bg-[#1A1A1A] border border-border/40 rounded-lg p-4 shadow-sm mt-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Account Num</span>
                      <span className="text-sm font-mono text-foreground tracking-widest translate-y-0.5">••••••••••••</span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><IconCopy size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <IconShieldCheck size={64} stroke={1} className="mb-4 opacity-20" />
          <p className="text-sm">Select an entry to view details</p>
        </div>
      )}
    </div>
  );
}
