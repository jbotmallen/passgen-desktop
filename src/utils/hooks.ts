import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { toast } from 'sonner';
import { logError } from '@/utils/logger';

export function useClipboard(clearDelay = 30000) {
  const copyToClipboard = async (text: string, description?: string) => {
    try {
      await writeText(text);
      toast.success('Copied to clipboard', {
        description: description ?? (
          clearDelay > 0
            ? 'Clipboard auto-clear is disabled to avoid wiping newer clipboard contents'
            : 'Clipboard will not clear automatically'
        ),
      });
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      logError('Failed to copy', error);
    }
  };

  return { copyToClipboard };
}
