import { GeneratorGuide } from './GeneratorGuide';
import { GeneratorTabs } from './GeneratorTabs';

interface GeneratorPanelProps {
  activeMode: string;
  onUsePassword?: (password: string) => void;
}

export function GeneratorPanel({ activeMode, onUsePassword }: GeneratorPanelProps) {
  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
      <div className="chip-card relative p-4.5 lg:p-6 flex flex-col min-h-full">
        <div className="chip-card-inner flex flex-col flex-1">
          <div className="flex-1">
            <GeneratorTabs activeMode={activeMode} onUsePassword={onUsePassword} />
          </div>
          <GeneratorGuide activeMode={activeMode} />
        </div>
      </div>
    </div>
  );
}
