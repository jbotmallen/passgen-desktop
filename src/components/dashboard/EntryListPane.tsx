import { useState, useMemo } from 'react';
import { IconPlus, IconStar, IconStarFilled, IconChevronLeft, IconChevronRight, IconUser, IconShieldCheck, IconTrash } from '@tabler/icons-react';
import { SettingsSelect } from '@/components/settings/SettingsSelect';
import { renderEntryIcon, renderStrengthBar } from '@/utils/helpers';
import type { Entry } from '@/utils/types';

interface EntryListPaneProps {
  entries: Entry[];
  allEntries: Entry[];
  selectedEntryId?: string;
  onSelectEntry: (entry: Entry) => void;
  onToggleFavorite: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onAddEntry: () => void;
}

export function EntryListPane({
  entries,
  allEntries,
  selectedEntryId,
  onSelectEntry,
  onToggleFavorite,
  onDeleteEntry,
  onAddEntry,
}: EntryListPaneProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filterMode, setFilterMode] = useState('all');
  const [sortMode, setSortMode] = useState('name_asc');

  const totalItems = allEntries.length;
  const weakCount = allEntries.filter(e => e.strength === 'Weak').length;
  const favoriteCount = allEntries.filter(e => e.is_favorite).length;

  const processedEntries = useMemo(() => {
    let result = [...entries];

    if (filterMode === 'weak') result = result.filter(e => e.strength === 'Weak');
    else if (filterMode === 'medium') result = result.filter(e => e.strength === 'Medium');
    else if (filterMode === 'strong') result = result.filter(e => e.strength === 'Strong');
    else if (filterMode === 'favorites') result = result.filter(e => e.is_favorite);

    if (sortMode === 'name_asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === 'name_desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortMode === 'strength_asc') {
      const score = { Weak: 0, Medium: 1, Strong: 2 };
      result.sort((a, b) => (score[a.strength as keyof typeof score] || 0) - (score[b.strength as keyof typeof score] || 0));
    } else if (sortMode === 'strength_desc') {
      const score = { Weak: 0, Medium: 1, Strong: 2 };
      result.sort((a, b) => (score[b.strength as keyof typeof score] || 0) - (score[a.strength as keyof typeof score] || 0));
    }

    return result;
  }, [entries, filterMode, sortMode]);

  const totalPages = Math.max(1, Math.ceil(processedEntries.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentEntries = processedEntries.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  return (
    <div className="w-full lg:flex-1 bg-[#111111] border-r border-border/40 flex flex-col min-w-0 z-0">
      <div className="p-6 pb-0 border-b border-border/40 bg-[#151515]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Total Items</p>
              <p className="text-xl font-bold text-foreground">{totalItems}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand tracking-wider uppercase">Weak</p>
              <p className="text-xl font-bold text-brand">{weakCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">Favorites</p>
              <p className="text-xl font-bold text-amber-400">{favoriteCount}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <SettingsSelect
            value={filterMode}
            onChange={(v) => { setFilterMode(v as string); setCurrentPage(1); }}
            options={[
              { label: 'All Strengths', value: 'all' },
              { label: 'Weak Only', value: 'weak' },
              { label: 'Medium Only', value: 'medium' },
              { label: 'Strong Only', value: 'strong' },
            ]}
          />
          <SettingsSelect
            value={sortMode}
            onChange={(v) => { setSortMode(v as string); setCurrentPage(1); }}
            options={[
              { label: 'Name (A-Z)', value: 'name_asc' },
              { label: 'Name (Z-A)', value: 'name_desc' },
              { label: 'Strength (Low-High)', value: 'strength_asc' },
              { label: 'Strength (High-Low)', value: 'strength_desc' },
            ]}
          />
        </div>

        <div className="flex text-xs font-semibold text-muted-foreground tracking-wider border-b border-border/40 pb-2">
          <div className="flex-1 flex items-center gap-2">
            <IconUser size={14} /> Account Identifier
          </div>
          <div className="text-right flex items-center gap-2">
            Strength <IconShieldCheck size={14} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            {allEntries.length === 0 ? (
              <>
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-brand/5 border border-brand/10 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
                        <line x1="12" y1="11" x2="12" y2="17"></line>
                        <line x1="9" y1="14" x2="15" y2="14"></line>
                      </svg>
                    </div>
                  </div>
                  {/* Subtle animated pulse ring */}
                  <div className="absolute inset-0 rounded-full border border-brand/10 animate-ping opacity-20" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">Your vault is empty</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-[220px] leading-relaxed">
                  Add your first password, secure note, or credit card to get started.
                </p>
                <button
                  onClick={onAddEntry}
                  className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-[#111111] font-semibold text-xs rounded-md transition-colors shadow-sm"
                >
                  <IconPlus size={14} stroke={2.5} />
                  Add First Entry
                </button>
              </>
            ) : (
              <>
                <div className="text-muted-foreground mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 mx-auto">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">No entries found</h3>
                <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
                  Try adjusting your search query or filters to find what you're looking for.
                </p>
              </>
            )}
          </div>
        ) : (
          currentEntries.map(entry => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className={`group flex items-center justify-between p-4 cursor-pointer transition-colors ${selectedEntryId === entry.id ? 'bg-[#1A1A1A] border-l-2 border-brand' : 'hover:bg-[#151515] border-l-2 border-transparent border-b border-b-border/20'}`}
            >
              <div className="flex items-center gap-3 truncate pr-2 flex-1 min-w-0">
                <div className="text-muted-foreground shrink-0">
                  {renderEntryIcon(entry.icon, 22)}
                </div>
                <div className="truncate flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                    {entry.is_favorite && (
                      <IconStarFilled size={12} className="text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{entry.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id); }}
                  className={`p-1 rounded transition-all ${
                    entry.is_favorite
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-transparent group-hover:text-muted-foreground/40 hover:text-amber-400!'
                  }`}
                  title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {entry.is_favorite ? <IconStarFilled size={14} /> : <IconStar size={14} />}
                </button>
                {renderStrengthBar(entry.strength)}
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteEntry(entry.id); }}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-all ml-2"
                  title="Delete entry"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border/40 flex items-center justify-between bg-[#151515] shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <SettingsSelect
            value={itemsPerPage}
            onChange={(v) => {
              setItemsPerPage(v as number);
              setCurrentPage(1);
            }}
            options={[
              { label: '20', value: 20 },
              { label: '50', value: 50 },
              { label: '100', value: 100 },
            ]}
          />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {processedEntries.length === 0 ? '0' : (safeCurrentPage - 1) * itemsPerPage + 1}-
            {Math.min(safeCurrentPage * itemsPerPage, processedEntries.length)} of {processedEntries.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
            >
              <IconChevronLeft size={18} />
            </button>
            <button
              disabled={safeCurrentPage === totalPages || processedEntries.length === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
