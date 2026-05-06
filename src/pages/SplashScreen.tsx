import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initDb, hasVaults } from '../lib/db';
import { logError } from '../utils/logger';
import GoldDust from '../components/GoldDust';
import CircuitLines from '../components/CircuitLines';

export default function SplashScreen() {
  const [stage, setStage] = useState<'mallen' | 'passgen'>('mallen');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Stage 1: Unity-style "Made by Mallen"
    const mallenTimer = setTimeout(() => {
      setStage('passgen');
    }, 2000);

    return () => clearTimeout(mallenTimer);
  }, []);

  useEffect(() => {
    if (stage === 'passgen') {
      let isSubscribed = true;

      const initializeApp = async () => {
        try {
          // Simulate loading progress while initializing DB
          const progressInterval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 90) return prev;
              return prev + Math.floor(Math.random() * 15);
            });
          }, 200);

          await initDb();
          const vaultsExist = await hasVaults();

          clearInterval(progressInterval);
          
          if (isSubscribed) {
            setProgress(100);
            setTimeout(() => {
              navigate(vaultsExist ? '/vaults' : '/welcome', { replace: true });
            }, 500);
          }
        } catch (error) {
          logError('Failed to initialize app', error);
        }
      };

      initializeApp();

      return () => {
        isSubscribed = false;
      };
    }
  }, [stage, navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background relative">
      <CircuitLines />
      <GoldDust count={40} />

      {stage === 'mallen' ? (
        <div className="flex flex-col items-center justify-center animate-pulse z-10">
          <span className="text-muted-foreground text-sm tracking-widest uppercase">Made by</span>
          <h1 className="text-4xl font-bold text-foreground mt-2 tracking-wider">Mallen</h1>
        </div>
      ) : (
        <div className="relative flex flex-col items-center justify-center w-full h-full">
          {/* Subtle background gradient rings */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-[600px] h-[600px] rounded-full border border-brand/5"></div>
            <div className="absolute w-[450px] h-[450px] rounded-full border border-brand/10"></div>
            <div className="absolute w-[300px] h-[300px] rounded-full border border-brand/20"></div>
          </div>

          <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="mb-6 drop-shadow-[0_0_25px_rgba(245,197,99,0.3)]">
              <img src="/logo.png" alt="Pass Gen" className="w-20 h-20" />
            </div>
            <h1 className="text-5xl font-light tracking-[0.2em] text-foreground mb-3 flex items-center">
              PASS <span className="font-bold text-brand ml-4">GEN</span>
            </h1>
            <p className="text-xs tracking-[0.3em] text-muted-foreground font-semibold">
              LOCAL-FIRST. PRIVATE. SECURE.
            </p>
          </div>

          <div className="absolute bottom-16 flex flex-col items-center w-64 z-10">
            <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider">
              Initializing secure environment...
            </p>
            <div className="w-full h-0.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
