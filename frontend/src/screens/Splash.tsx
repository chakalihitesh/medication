import { useEffect } from 'react';

interface SplashProps {
  onComplete: () => void;
}

export function Splash({ onComplete }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // Give user enough time to see the splash screen
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FB] px-5">
      <div className="w-[180px] h-[180px] bg-white rounded-sm shadow-[0_0_60px_rgba(0,0,0,0.04)] flex items-center justify-center mb-10">
        <img 
          src="/logo.svg" 
          alt="HealthMate AI Logo" 
          className="w-24 h-24 object-contain animate-pulse"
        />
      </div>
      <h1 className="text-2xl font-semibold text-primary mb-4 text-center tracking-tight">Initializing HealthMate AI...</h1>
      <p className="text-[#434654] text-center max-w-[300px] text-[17px] leading-relaxed">
        Securing connection and loading<br />your clinical profile
      </p>
    </div>
  );
}
