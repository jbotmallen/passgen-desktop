import { useNavigate } from 'react-router-dom';
import { IconLock } from '@tabler/icons-react';
import GoldDust from '../components/GoldDust';
import CircuitLines from '../components/CircuitLines';
import GoldSmoke from '../components/GoldSmoke';
import { Button } from '@/components/ui/button';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-background relative overflow-hidden min-w-[720px] min-h-[500px]">
      <CircuitLines />
      <GoldDust count={35} />

      {/* Top Left Logo - clickable anchor to landing page */}
      <a href="/welcome" onClick={(e) => { e.preventDefault(); navigate('/welcome'); }} className="absolute top-6 left-8 flex items-center gap-3 z-10 group">
        <img src="/logo.png" alt="Pass Gen" className="w-7 h-7 group-hover:drop-shadow-[0_0_8px_rgba(245,197,99,0.4)] transition-all" />
        <span className="font-semibold text-sm tracking-widest text-foreground">PASS GEN</span>
      </a>

      {/* Left Column: Typography & CTA — pushed to bottom */}
      <div className="flex flex-col items-start justify-end max-w-xl z-10 pl-12 pb-16">
        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] text-foreground mb-6">
          Your data.<br />
          Your device.<br />
          <span className="text-brand">Your control.</span>
        </h1>

        <p className="text-muted-foreground text-sm lg:text-base leading-relaxed mb-10 max-w-xs md:max-w-md">
          Pass Gen is a local-first password vault that keeps your data private and in your control.
          Generate strong, unique passwords and store them securely on your device.
        </p>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/vaults')}
            size="lg"
            className="gap-3 text-sm lg:text-base px-6 lg:px-8 py-5 lg:py-6 shadow-[0_4px_20px_0_rgba(245,197,99,0.25)]"
          >
            <img src="/logo.png" alt="" className="w-5 h-5" />
            Get Started
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/generate')}
            className="text-muted-foreground hover:text-brand hover:bg-brand/5 gap-2 text-sm lg:text-base px-6 lg:px-8 py-5 lg:py-6"
          >
            <IconLock size={18} />
            Generate Password
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-8 text-muted-foreground/70 text-xs lg:text-sm">
          <IconLock size={14} />
          <span>100% local. Nothing leaves your device.</span>
        </div>
      </div>

      {/* Right Column: Safe Image — anchored bottom right, with organic gold smoke */}
      <div className="absolute bottom-0 right-0 w-4/5 h-full pointer-events-none z-0">
        <GoldSmoke />
        <img
          src="/safe.png"
          alt="Secure Local Vault"
          className="absolute -bottom-10 -right-40 w-full h-full object-contain object-bottom-right drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          style={{
            filter: 'blur(0.8px) contrast(1.02)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            WebkitMaskComposite: 'source-in',
          }}
        />
      </div>
    </div>
  );
}

