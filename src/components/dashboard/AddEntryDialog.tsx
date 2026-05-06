import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordCriteria from '@/components/PasswordCriteria';
import { PasswordInput } from '@/components/PasswordInput';

interface AddEntryDialogProps {
  open: boolean;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  onOpenChange: (open: boolean) => void;
  onTitleChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

export function AddEntryDialog({
  open,
  title,
  username,
  password,
  url,
  notes,
  onOpenChange,
  onTitleChange,
  onUsernameChange,
  onPasswordChange,
  onUrlChange,
  onNotesChange,
}: AddEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Entry</DialogTitle>
          <DialogDescription>Store a new secure credential in your vault.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 px-8 py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. GitHub, Netflix" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username / Email</Label>
              <Input id="username" value={username} onChange={(e) => onUsernameChange(e.target.value)} placeholder="john.doe@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input id="url" value={url} onChange={(e) => onUrlChange(e.target.value)} placeholder="https://example.com" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="••••••••••••" />
              <PasswordCriteria password={password} className="mt-4" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional details..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)} disabled={!title || !password}>
            Save Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

