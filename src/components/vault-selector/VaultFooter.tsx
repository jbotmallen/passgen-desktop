import { IconLock, IconSettings } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface VaultFooterProps {
  onOpenSettings: () => void;
}

export function VaultFooter({ onOpenSettings }: VaultFooterProps) {
  return (
    <div className="absolute bottom-8 w-full px-8 flex items-center justify-between">
      <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={onOpenSettings}>
        <IconSettings size={18} /> Settings
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
        <IconLock size={18} /> Lock App
      </Button>
    </div>
  );
}
