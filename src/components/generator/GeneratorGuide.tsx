import { IconInfoCircle } from '@tabler/icons-react';
import { GUIDES } from './constants';

interface GeneratorGuideProps {
  activeMode: string;
}

export function GeneratorGuide({ activeMode }: GeneratorGuideProps) {
  const guide = GUIDES[activeMode];

  if (!guide) return null;

  return (
    <div className="mt-auto pt-5 border-t border-border/20 space-y-2">
      <div className="flex items-center gap-1.5">
        <IconInfoCircle size={16} className="text-brand/50" />
        <p className="text-xs font-bold text-brand tracking-wider">
          How {guide.title} works
        </p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {guide.body}
      </p>
    </div>
  );
}

