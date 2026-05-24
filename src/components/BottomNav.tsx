import { Home, Pill, Bot, FileText, User } from 'lucide-react';
import { Screen } from '../types';
import { cn } from '../lib/utils';

interface BottomNavProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, setScreen }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'meds', icon: Pill, label: 'Meds' },
    { id: 'assistant', icon: Bot, label: 'Assistant' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-2 pb-6 bg-surface-container-lowest shadow-[0_-4px_12px_rgba(0,104,122,0.05)] rounded-t-xl border-t border-surface-variant/50 lg:hidden">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setScreen(item.id as Screen)}
            className="flex flex-col items-center justify-center min-w-[64px] active:scale-90 transition-transform duration-150"
          >
            <div className={cn(
              "px-4 py-1 rounded-full mb-1 flex items-center justify-center transition-colors",
              isActive ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container-high"
            )}>
              <Icon size={24} className={isActive ? "fill-current" : ""} />
            </div>
            <span className={cn(
              "text-[12px] leading-tight font-semibold tracking-wide",
              isActive ? "text-on-surface" : "text-on-surface-variant"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
