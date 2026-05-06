interface VaultTopLogoProps {
  onNavigateWelcome: () => void;
}

export function VaultTopLogo({ onNavigateWelcome }: VaultTopLogoProps) {
  return (
    <a href="/welcome" onClick={(e) => { e.preventDefault(); onNavigateWelcome(); }} className="absolute top-8 left-8 flex items-center gap-3 z-10 group cursor-pointer">
      <img src="/logo.png" alt="Pass Gen" className="w-7 h-7 group-hover:drop-shadow-[0_0_8px_rgba(245,197,99,0.4)] transition-all" />
      <span className="font-semibold text-sm tracking-widest text-foreground">PASS GEN</span>
    </a>
  );
}

