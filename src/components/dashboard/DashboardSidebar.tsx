import {
  IconKey,
  IconLogout,
  IconPlus,
  IconSettings,
  IconShieldCheck,
  IconStar,
  IconTag,
  IconX,
} from '@tabler/icons-react';

interface DashboardSidebarProps {
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  onAddEntry: () => void;
  onLock: () => void;
  onOpenSettings: () => void;
  allTags: string[];
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

const navItems = [
  { id: 'all', label: 'All Items', icon: IconKey },
  { id: 'favorites', label: 'Favorites', icon: IconStar },
  { id: 'security', label: 'Security', icon: IconShieldCheck, comingSoon: true },
];

export function DashboardSidebar({
  activeTab,
  onActiveTabChange,
  onAddEntry,
  onLock,
  onOpenSettings,
  allTags,
  activeTag,
  onTagSelect,
}: DashboardSidebarProps) {
  return (
    <div className="w-16 lg:w-64 bg-[#0A0A0A] border-r border-border/40 flex flex-col justify-between transition-all duration-300 z-10 shrink-0">
      <div className="flex flex-col min-h-0">
        <div className="p-4 lg:p-6 border-b border-border/20 flex justify-center lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 rounded-md bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20">M</div>
            <div className="hidden lg:block">
              <h3 className="text-sm font-semibold text-foreground truncate">Mallen Security</h3>
              <p className="text-xs text-muted-foreground font-mono truncate">Local-First Vault</p>
            </div>
          </div>
        </div>

        <div className="pb-4 flex flex-col gap-1">
          {navItems.map(({ id, label, icon: Icon, comingSoon }) => (
            <button
              key={id}
              onClick={() => !comingSoon && onActiveTabChange(id)}
              disabled={comingSoon}
              className={`group/nav relative flex items-center lg:justify-between px-0 lg:px-6 py-2.5 text-sm transition-colors justify-center ${activeTab === id && !activeTag && !comingSoon ? 'bg-[#1A1A1A] text-brand lg:border-l-2 lg:border-brand' : 'text-muted-foreground hover:text-foreground'} ${comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} stroke={1.5} className={activeTab === id && !activeTag && !comingSoon ? 'text-brand' : ''} />
                <span className="hidden lg:inline">{label}</span>
              </div>
              {comingSoon && (
                <span className="hidden lg:inline text-[9px] font-bold uppercase tracking-wider bg-brand/10 text-brand px-1.5 py-0.5 rounded">Soon</span>
              )}
              {/* Tooltip for collapsed state */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-foreground text-xs font-medium rounded border border-border/40 whitespace-nowrap opacity-0 group-hover/nav:opacity-100 pointer-events-none lg:hidden z-50 flex items-center gap-2 shadow-xl">
                {label}
                {comingSoon && <span className="text-[9px] font-bold uppercase tracking-wider text-brand">Soon</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div className="px-0 lg:px-6 py-4 border-t border-border/20">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
              <IconTag size={14} className="text-muted-foreground" />
              <p className="hidden lg:block text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Tags</p>
            </div>
            <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto items-center lg:items-stretch">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onTagSelect(activeTag === tag ? null : tag)}
                  className={`group/tag relative flex items-center justify-center lg:justify-between px-0 lg:px-3 py-1.5 w-8 lg:w-auto rounded-md text-xs transition-all ${
                    activeTag === tag
                      ? 'bg-brand/10 text-brand border border-brand/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A] border border-transparent'
                  }`}
                >
                  <span className="hidden lg:inline truncate">{tag}</span>
                  <span className="lg:hidden text-[10px] font-bold">{tag.slice(0, 2).toUpperCase()}</span>
                  {activeTag === tag && (
                    <IconX size={12} className="hidden lg:block shrink-0 ml-2 opacity-60 hover:opacity-100" />
                  )}
                  {/* Tooltip for tag */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-foreground text-xs font-medium rounded border border-border/40 whitespace-nowrap opacity-0 group-hover/tag:opacity-100 pointer-events-none lg:hidden z-50 shadow-xl">
                    {tag}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 lg:p-6 flex flex-col gap-4 items-center lg:items-stretch">
        <button
          onClick={onAddEntry}
          className="group/btn relative flex items-center justify-center gap-2 w-10 h-10 lg:w-full lg:h-auto lg:py-2.5 bg-brand hover:bg-brand-hover text-[#111111] font-semibold rounded-md lg:rounded-md transition-colors text-sm shrink-0"
        >
          <IconPlus size={18} stroke={2} />
          <span className="hidden lg:inline">New Entry</span>
          <div className="absolute left-full ml-2 px-2 py-1 bg-brand text-[#111111] text-xs font-bold rounded border border-brand/40 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none lg:hidden z-50 shadow-xl">
            New Entry
          </div>
        </button>
        <div className="flex flex-col gap-2 border-t border-border/20 pt-4 w-full items-center lg:items-stretch">
          <button onClick={onOpenSettings} className="group/btn relative flex items-center justify-center lg:justify-start gap-3 w-10 h-10 lg:w-auto lg:h-auto text-sm text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A] lg:hover:bg-transparent rounded-md lg:rounded-none transition-colors">
            <IconSettings size={18} /> <span className="hidden lg:inline">Settings</span>
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-foreground text-xs font-medium rounded border border-border/40 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none lg:hidden z-50 shadow-xl">
              Settings
            </div>
          </button>
          <button onClick={onLock} className="group/btn relative flex items-center justify-center lg:justify-start gap-3 w-10 h-10 lg:w-auto lg:h-auto text-sm text-muted-foreground hover:text-red-400 hover:bg-[#1A1A1A] lg:hover:bg-transparent rounded-md lg:rounded-none transition-colors">
            <IconLogout size={18} /> <span className="hidden lg:inline">Lock</span>
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-red-400 text-xs font-medium rounded border border-border/40 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 pointer-events-none lg:hidden z-50 shadow-xl">
              Lock
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
