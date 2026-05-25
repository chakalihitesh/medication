import { ArrowLeft, Bell, Menu, ChevronLeft, HeartPulse } from 'lucide-react';
import { Screen } from '../types';
import { cn } from '../lib/utils';
import { currentUser } from '../data';
import { t } from '../lib/translations';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  showAvatar?: boolean;
}

export function TopBar({ title, showBack, onBack, showMenu, showAvatar }: TopBarProps) {
  const normTitle = (title || "").toLowerCase();
  const titleKey = (title || "HealthMate AI").toLowerCase().replace(/\s+/g, '_');
  const displayTitle = t(titleKey, title || "HealthMate AI");

  return (
    <header className="flex justify-between items-center w-full px-5 py-2 bg-surface shadow-sm sticky top-0 z-40 h-[68px] shrink-0 border-b border-surface-variant/30">
      <div className="flex items-center gap-3 w-1/4">
        {showBack && onBack ? (
          <button 
            onClick={onBack}
            className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 p-2 rounded-full -ml-2"
          >
            {(normTitle === "family health" || normTitle === "personal info" || normTitle === "edit profile") ? <ChevronLeft size={28} /> : <ArrowLeft size={24} />}
          </button>
        ) : (
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className="w-10 h-10 object-contain"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center items-center">
        {showBack && title === "Add New Medication" && (
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className="w-8 h-8 object-contain mb-1"
          />
        )}
        {normTitle === "personal info" ? (
          <div className="flex items-center gap-2">
            <HeartPulse size={24} className="text-[#e84b6f]" />
            <h1 className="text-[22px] font-bold text-[#0052cc] italic tracking-tight text-center">{displayTitle}</h1>
          </div>
        ) : (
          <h1 className={cn(
            "tracking-tight text-center",
            normTitle === "family health" ? "text-base font-semibold text-[#0052cc]" : "text-[22px] font-bold text-primary"
          )}>
            {displayTitle}
          </h1>
        )}
      </div>

      <div className="flex items-center justify-end w-1/4">
        {showAvatar ? (
          <button className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-surface-variant">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK1t0-KuE7Mb6VWVSfGYsU2vu0zaWRMKB7PTC8YDSkpl0ObDQNSgkqjsMfUgDl1Up63g6MRwpABu3ELST9JzkO9qcqDNk77Gs_80sP_CJJjM8_ofFVRqcaSvbv2SrxzPErW3wsCs29SXNQoBTWb6XDqyPCQs6Iw8OwtZcZutZ4_z4z2JIQbtDSgYiyKoaUwgn79uL0dmneQMKHnuqIGvcJYi3t-x14uW_ODkjaKoZ-3d-mIPmaGcWdPNpuV0GnQZRmSx5BdH9vXq4" alt="User" className="w-full h-full object-cover" />
          </button>
        ) : (
          <button className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 p-2 rounded-full relative -mr-2">
            <Bell size={24} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#DE350B] rounded-full block border-2 border-surface"></span>
          </button>
        )}
      </div>
    </header>
  );
}
