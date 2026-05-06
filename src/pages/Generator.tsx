import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CircuitLines from '@/components/CircuitLines';
import { GeneratorPanel } from '@/components/generator/GeneratorPanel';
import { GeneratorTopBar } from '@/components/generator/GeneratorTopBar';
import { ModeSelector } from '@/components/generator/ModeSelector';
import GoldDust from '@/components/GoldDust';

export default function Generator() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('standard');

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden min-w-[720px] min-h-[500px]">
      <CircuitLines />
      <GoldDust count={20} />

      <GeneratorTopBar
        onBack={() => navigate(-1)}
        onNavigateWelcome={() => navigate('/welcome')}
      />

      <div className="flex flex-1 px-8 pb-8 gap-6 z-10 overflow-hidden w-full max-w-7xl mx-auto">
        <ModeSelector activeMode={activeMode} onActiveModeChange={setActiveMode} />
        <GeneratorPanel activeMode={activeMode} />
      </div>
    </div>
  );
}

