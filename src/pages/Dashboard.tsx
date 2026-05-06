import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopNav } from '@/components/dashboard/DashboardTopNav';
import { EntryDetailsPane } from '@/components/dashboard/EntryDetailsPane';
import { EntryListPane } from '@/components/dashboard/EntryListPane';
import { LockVaultDialog } from '@/components/dashboard/LockVaultDialog';
import { ImportPasswordsDialog } from '@/components/dashboard/ImportPasswordsDialog';
import { DeleteEntryDialog } from '@/components/dashboard/DeleteEntryDialog';
import { AutoLockHandler } from '@/components/AutoLockHandler';
import { decryptEntryField, deleteEntry, listEntries, toggleEntryFavorite, updateEntryTags } from '@/lib/backend';
import { getVaultSettings } from '@/lib/settings';
import { logError } from '@/utils/logger';
import type { Entry } from '@/utils/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const vaultId = location.state?.vaultId;
  const [activeTab, setActiveTab] = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [clipboardClearDelay, setClipboardClearDelay] = useState(30000);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const rows = await listEntries(vaultId);

      if (rows.length === 0) {
        setEntries([]);
        return;
      }

      const mapped: Entry[] = rows.map(r => ({
        id: r.id,
        title: r.title,
        username: r.username ?? '',
        website_url: r.website_url ?? '',
        strength: r.strength ?? 'Weak',
        icon: 'world',
        category: r.category || 'Login',
        is_favorite: Boolean(r.is_favorite),
        tags: r.tags ?? undefined,
        encrypted_password: r.encrypted_password ?? undefined,
        encrypted_totp_seed: r.encrypted_totp_seed ?? undefined,
        encrypted_notes: r.encrypted_notes ?? undefined,
        encrypted_fields: r.encrypted_fields ?? undefined,
        updated_at: r.updated_at ?? undefined,
      }));
      setEntries(mapped);
    } catch (error) {
      logError('Failed to load entries', error);
    }
  }, [vaultId]);

  useEffect(() => {
    if (!vaultId) {
      navigate('/vaults', { replace: true });
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, [loadEntries, navigate, vaultId]);

  useEffect(() => {
    let isMounted = true;

    async function loadClipboardSetting() {
      if (!vaultId) return;
      try {
        const settings = await getVaultSettings(vaultId);
        if (isMounted) setClipboardClearDelay(settings.clipboard_clear_delay);
      } catch (error) {
        logError('Failed to load clipboard setting', error);
      }
    }

    loadClipboardSetting();

    return () => {
      isMounted = false;
    };
  }, [vaultId]);

  const handleSelectEntry = useCallback(async (entry: Entry) => {
    setSelectedEntry(entry);
    setShowPassword(false);

    if (entry.encrypted_password && !entry.password) {
      try {
        const result = await decryptEntryField(vaultId, entry.id, 'password');
        if (result.success && result.data) {
          setSelectedEntry(prev => prev ? { ...prev, password: result.data } : null);
        }
      } catch (error) {
        logError('Failed to decrypt password', error);
      }
    }
  }, [vaultId]);

  // ── Auto-select newly created entry ────────────────────────────────
  useEffect(() => {
    if (entries.length > 0 && location.state?.newEntryId) {
      const newEntryId = location.state.newEntryId;
      const entry = entries.find(e => e.id === newEntryId);
      if (entry) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        handleSelectEntry(entry);
        // Remove newEntryId from state so it doesn't re-trigger on reload
        navigate(location.pathname, { state: { vaultId: location.state.vaultId }, replace: true });
      }
    }
  }, [entries, handleSelectEntry, location.pathname, location.state, navigate, vaultId]);

  // ── Derived: collect all unique tags across entries ─────────────────
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(e => {
      if (e.tags) {
        const parsed: string[] = (() => {
          try { return JSON.parse(e.tags); }
          catch { return e.tags.split(',').map((t: string) => t.trim()).filter(Boolean); }
        })();
        parsed.forEach(t => tagSet.add(t));
      }
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // ── Derived: filtered entry list based on active tab, tag, and search ──
  const filteredEntries = useMemo(() => {
    let list = entries;

    // Tab filter
    if (activeTab === 'favorites') {
      list = list.filter(e => e.is_favorite);
    }

    // Tag filter
    if (activeTag) {
      list = list.filter(e => {
        if (!e.tags) return false;
        const parsed: string[] = (() => {
          try { return JSON.parse(e.tags); }
          catch { return e.tags!.split(',').map((t: string) => t.trim()).filter(Boolean); }
        })();
        return parsed.includes(activeTag);
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.username?.toLowerCase().includes(q) ||
        e.website_url?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [entries, activeTab, activeTag, searchQuery]);

  // ── Toggle favorite on an entry ────────────────────────────────────
  const handleToggleFavorite = useCallback(async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    const newValue = entry.is_favorite ? 0 : 1;

    try {
      await toggleEntryFavorite(vaultId, entryId, Boolean(newValue));

      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, is_favorite: Boolean(newValue) } : e
      ));

      // Also update selectedEntry if it's the same one
      setSelectedEntry(prev =>
        prev?.id === entryId ? { ...prev, is_favorite: Boolean(newValue) } : prev
      );
    } catch (error) {
      logError('Failed to toggle favorite', error);
    }
  }, [entries, vaultId]);

  // ── Delete entry ───────────────────────────────────────────────────
  const handleInitiateDelete = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry) setEntryToDelete(entry);
  }, [entries]);

  const handleDeleteEntry = useCallback(async () => {
    if (!entryToDelete) return;

    try {
      await deleteEntry(vaultId, entryToDelete.id);

      setEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      if (selectedEntry?.id === entryToDelete.id) {
        setSelectedEntry(null);
        setShowPassword(false);
      }
      toast.success('Entry deleted');
    } catch (error) {
      logError('Failed to delete entry', error);
      toast.error('Failed to delete entry');
    }
  }, [entryToDelete, selectedEntry, vaultId]);

  // ── Update tags on an entry ────────────────────────────────────────
  const handleUpdateTags = useCallback(async (entryId: string, newTags: string[]) => {
    const tagsJson = JSON.stringify(newTags);

    try {
      await updateEntryTags(vaultId, entryId, tagsJson);

      setEntries(prev => prev.map(e =>
        e.id === entryId ? { ...e, tags: tagsJson } : e
      ));

      setSelectedEntry(prev =>
        prev?.id === entryId ? { ...prev, tags: tagsJson } : prev
      );
    } catch (error) {
      logError('Failed to update tags', error);
    }
  }, [vaultId]);

  const handleEditEntry = () => {
    if (selectedEntry) {
      navigate('/add-entry', { state: { vaultId, entryId: selectedEntry.id } });
    }
  };

  const handleLock = async () => {
    try {
      await invoke('lock_vault');
      navigate('/vaults', { replace: true });
    } catch (error) {
      logError('Failed to lock vault', error);
    }
  };

  // ── Handle sidebar tab changes: clear tag filter when switching tabs ──
  const handleActiveTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'all') {
      setActiveTag(null);
    }
  };

  // ── Handle tag filter from sidebar ─────────────────────────────────
  const handleTagSelect = (tag: string | null) => {
    setActiveTag(tag);
    setActiveTab('all');
  };

  return (
    <div className="flex h-screen w-full bg-[#111111] text-foreground overflow-hidden font-sans">
      <DashboardTopNav
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onNavigateWelcome={() => navigate('/welcome')}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {vaultId && <AutoLockHandler vaultId={vaultId} />}


      <div className="flex w-full h-full pt-14">
        <DashboardSidebar
          activeTab={activeTab}
          onActiveTabChange={handleActiveTabChange}
          onAddEntry={() => navigate('/add-entry', { state: { vaultId } })}
          onLock={() => setIsLockModalOpen(true)}
          onOpenSettings={() => navigate('/settings', { state: { vaultId } })}
          allTags={allTags}
          activeTag={activeTag}
          onTagSelect={handleTagSelect}
        />
        <EntryListPane
          entries={filteredEntries}
          allEntries={entries}
          selectedEntryId={selectedEntry?.id}
          onSelectEntry={handleSelectEntry}
          onToggleFavorite={handleToggleFavorite}
          onDeleteEntry={handleInitiateDelete}
          onAddEntry={() => navigate('/add-entry', { state: { vaultId } })}
        />
        <Dialog open={!!selectedEntry && !isLargeScreen} onOpenChange={(open) => { if (!open) { setSelectedEntry(null); setShowPassword(false); } }}>
          <DialogContent className="sm:max-w-3xl p-0 bg-[#151515] border-border/40 overflow-hidden max-h-[90vh] flex flex-col [&>button]:hidden">
            <DialogTitle className="sr-only">Entry Details</DialogTitle>
            <div className="flex justify-end p-4 pb-0 absolute right-0 top-0 z-10">
              <button onClick={() => { setSelectedEntry(null); setShowPassword(false); }} className="p-2 bg-[#1A1A1A] hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <EntryDetailsPane
              selectedEntry={selectedEntry}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(prev => !prev)}
              onToggleFavorite={handleToggleFavorite}
              onUpdateTags={handleUpdateTags}
              onEditEntry={handleEditEntry}
              clipboardClearDelay={clipboardClearDelay}
            />
          </DialogContent>
        </Dialog>

        {isLargeScreen && (
          <div className="flex-1 min-w-0 bg-[#151515] border-l border-border/40 overflow-hidden flex flex-col">
            <EntryDetailsPane
              selectedEntry={selectedEntry}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(prev => !prev)}
              onToggleFavorite={handleToggleFavorite}
              onUpdateTags={handleUpdateTags}
              onEditEntry={handleEditEntry}
              clipboardClearDelay={clipboardClearDelay}
            />
          </div>
        )}
      </div>


      <LockVaultDialog
        open={isLockModalOpen}
        onOpenChange={setIsLockModalOpen}
        onConfirmLock={handleLock}
      />

      <ImportPasswordsDialog
        open={isImportOpen}
        vaultId={vaultId ?? null}
        onOpenChange={setIsImportOpen}
        onImported={loadEntries}
      />

      <DeleteEntryDialog
        open={!!entryToDelete}
        titleToMatch={entryToDelete?.title ?? ''}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
      />
    </div>
  );
}
