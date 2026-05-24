import { useState, useEffect, useRef } from 'react';
import { Screen, Medication } from './types';
import { Splash } from './screens/Splash';
import { Login } from './screens/Login';
import { Home } from './screens/Home';
import { Meds } from './screens/Meds';
import { AddMed } from './screens/AddMed';
import { Assistant } from './screens/Assistant';
import { Reports } from './screens/Reports';
import { Profile } from './screens/Profile';
import { Family } from './screens/Family';
import { PersonalInfo } from './screens/PersonalInfo';
import { EditProfile } from './screens/EditProfile';
import { BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';
import { api, ApiMedication } from './lib/api';
import { convertTo24h, formatTime12h } from './lib/utils';
import { BellRing, Check, Volume2, Loader2, Wifi, WifiOff } from 'lucide-react';

// ---- Helpers ----
function apiMedToLocal(m: ApiMedication): Medication {
  return {
    id: String(m.id),
    name: m.name,
    time: m.time,
    dosage: m.dosage,
    status: m.status as 'taken' | 'pending' | 'missed',
    schedule: m.schedule as 'morning' | 'afternoon' | 'evening',
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [language, setLanguage] = useState<string>(localStorage.getItem('preferred_language') || 'english');

  // API-synced medication state
  const [meds, setMeds] = useState<Medication[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null); // null = unknown

  // Alarm from backend IST scheduler
  const [activeAlarm, setActiveAlarm] = useState<Medication | null>(null);
  const [istTime, setIstTime] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fallback local refs (when backend offline)
  const triggeredMedsRef = useRef<Record<string, string>>({});
  const snoozedAlertsRef = useRef<Record<string, string>>({});

  // ---- Load meds from backend on mount ----
  useEffect(() => {
    loadMedsFromBackend();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadMedsFromBackend = async () => {
    try {
      const res = await api.getMedications();
      setMeds(res.medications.map(apiMedToLocal));
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      // Load from localStorage fallback
      const stored = localStorage.getItem('medication_items');
      if (stored) {
        try { setMeds(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
  };

  // ---- Poll backend for active alarm + IST time every 5s ----
  useEffect(() => {
    const pollAlarm = async () => {
      try {
        const alarmState = await api.getActiveAlarm();
        setIstTime(alarmState.ist_time);
        setBackendOnline(true);

        if (alarmState.active && alarmState.alarm && !activeAlarm) {
          // Backend fired an alarm — show it in the UI
          const med = apiMedToLocal(alarmState.alarm);
          triggerAlarmUI(med);
        }
      } catch {
        setBackendOnline(false);
        // --- Fallback: local IST calculation ---
        runLocalFallbackScheduler();
      }
    };

    pollAlarm();
    const interval = setInterval(pollAlarm, 5000);
    return () => clearInterval(interval);
  }, [meds, activeAlarm]);

  // ---- Local fallback scheduler (when backend offline) ----
  const runLocalFallbackScheduler = () => {
    // Get IST time using Intl API (no backend needed)
    const istNow = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    );
    const h = String(istNow.getHours()).padStart(2, '0');
    const m = String(istNow.getMinutes()).padStart(2, '0');
    const current24h = `${h}:${m}`;
    setIstTime(`${h}:${m}:${String(istNow.getSeconds()).padStart(2, '0')}`);

    const todayDate = istNow.toDateString();
    const lastResetDate = localStorage.getItem('last_reset_date');
    if (lastResetDate !== todayDate) {
      setMeds(prev => prev.map(med => ({ ...med, status: 'pending' })));
      localStorage.setItem('last_reset_date', todayDate);
      triggeredMedsRef.current = {};
      snoozedAlertsRef.current = {};
    }

    meds.forEach(med => {
      const medTime24h = convertTo24h(med.time);
      const isScheduledTime = current24h === medTime24h && med.status === 'pending';
      const isSnoozedTime = current24h === snoozedAlertsRef.current[med.id];
      const alreadyTriggered = triggeredMedsRef.current[med.id] === current24h;

      if ((isScheduledTime || isSnoozedTime) && !alreadyTriggered && !activeAlarm) {
        triggeredMedsRef.current[med.id] = current24h;
        if (snoozedAlertsRef.current[med.id]) delete snoozedAlertsRef.current[med.id];
        triggerAlarmUI(med);
      }
    });
  };

  // ---- Trigger alarm UI (sound + notification + overlay) ----
  const triggerAlarmUI = (med: Medication) => {
    setActiveAlarm(med);

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/alarm.wav');
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err =>
        console.warn('Audio autoplay blocked:', err)
      );
    } catch (e) {
      console.error('Audio failed:', e);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Medicine Reminder', {
        body: `Time to take ${med.name} (${med.dosage})!`,
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }
  };

  // ---- Alarm Actions ----
  const handleTakeMedication = async () => {
    if (!activeAlarm) return;
    if (audioRef.current) audioRef.current.pause();

    if (backendOnline) {
      try {
        await api.takeMedication();
        await loadMedsFromBackend();
      } catch { /* silent */ }
    } else {
      setMeds(prev =>
        prev.map(m => m.id === activeAlarm.id ? { ...m, status: 'taken' } : m)
      );
    }
    setActiveAlarm(null);
  };

  const handleSnoozeAlarm = async () => {
    if (!activeAlarm) return;
    if (audioRef.current) audioRef.current.pause();

    if (backendOnline) {
      try {
        await api.snoozeMedication();
      } catch { /* silent */ }
    } else {
      const istNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const snooze = new Date(istNow.getTime() + 5 * 60 * 1000);
      const hhmm = `${String(snooze.getHours()).padStart(2, '0')}:${String(snooze.getMinutes()).padStart(2, '0')}`;
      snoozedAlertsRef.current[activeAlarm.id] = hhmm;
    }
    setActiveAlarm(null);
  };

  // ---- Med CRUD (synced to backend) ----
  const addMed = async (newMed: Omit<Medication, 'id'>) => {
    if (backendOnline) {
      try {
        await api.addMedication({
          name: newMed.name,
          time: convertTo24h(newMed.time),
          dosage: newMed.dosage,
          frequency: 'Daily',
          schedule: newMed.schedule,
        });
        await loadMedsFromBackend();
        return;
      } catch { /* fallback to local */ }
    }
    const id = 'm-' + Math.random().toString(36).substring(2, 9);
    setMeds(prev => [...prev, { ...newMed, id }]);
  };

  const toggleMed = async (id: string) => {
    const med = meds.find(m => m.id === id);
    if (!med) return;
    const newStatus = med.status === 'taken' ? 'pending' : 'taken';

    if (backendOnline && !isNaN(Number(id))) {
      try {
        await api.updateMedStatus(Number(id), newStatus);
        await loadMedsFromBackend();
        return;
      } catch { /* fallback */ }
    }
    setMeds(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  const deleteMed = async (id: string) => {
    if (backendOnline && !isNaN(Number(id))) {
      try {
        await api.deleteMedication(Number(id));
        await loadMedsFromBackend();
        return;
      } catch { /* fallback */ }
    }
    setMeds(prev => prev.filter(m => m.id !== id));
  };

  // ---- Sync local meds to localStorage as backup ----
  useEffect(() => {
    localStorage.setItem('medication_items', JSON.stringify(meds));
  }, [meds]);

  // ---- Routing ----
  if (screen === 'splash') return <Splash onComplete={() => setScreen('login')} />;
  if (screen === 'login') return <Login onLogin={() => setScreen('home')} />;

  let topBarProps: Record<string, unknown> = {};
  switch (screen) {
    case 'add-med':
      topBarProps = { title: 'Add New Medication', showBack: true, onBack: () => setScreen('meds') };
      break;
    case 'family':
      topBarProps = { title: 'FAMILY HEALTH', showBack: true, onBack: () => setScreen('profile') };
      break;
    case 'personal-info':
      topBarProps = { title: 'Personal Info', showBack: true, onBack: () => setScreen('profile'), showAvatar: true };
      break;
    case 'edit-profile':
      topBarProps = { title: 'Edit Profile', showBack: true, onBack: () => setScreen('profile'), showAvatar: true };
      break;
    case 'meds':
      topBarProps = { title: 'My Medications', showMenu: true };
      break;
    default:
      topBarProps = { title: 'HealthMate AI' };
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':    return <Home setScreen={setScreen} />;
      case 'meds':    return <Meds setScreen={setScreen} meds={meds} toggleMed={toggleMed} deleteMed={deleteMed} />;
      case 'add-med': return <AddMed setScreen={setScreen} addMed={addMed} />;
      case 'assistant': return <Assistant />;
      case 'reports':   return <Reports meds={meds} />;
      case 'profile':   return <Profile setScreen={setScreen} onLanguageChange={setLanguage} />;
      case 'family':    return <Family />;
      case 'personal-info': return <PersonalInfo />;
      case 'edit-profile':  return <EditProfile setScreen={setScreen} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-surface relative">
      <TopBar {...topBarProps} />

      {/* IST Time + Backend Status indicator */}
      <div className="flex items-center justify-between px-5 py-1 bg-surface-container/60 border-b border-surface-variant/30">
        <span className="text-[10px] font-semibold text-on-surface-variant tracking-wider uppercase">
          {istTime ? `IST ${istTime}` : 'Syncing...'}
        </span>
        <span className={`flex items-center gap-1 text-[10px] font-semibold ${backendOnline === null ? 'text-outline' : backendOnline ? 'text-secondary' : 'text-amber-500'}`}>
          {backendOnline === null
            ? <><Loader2 size={10} className="animate-spin" /> Connecting</>
            : backendOnline
            ? <><Wifi size={10} /> AI Online</>
            : <><WifiOff size={10} /> Offline Mode</>}
        </span>
      </div>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        {renderScreen()}
      </main>

      {['home', 'meds', 'assistant', 'reports', 'profile'].includes(screen) && (
        <BottomNav currentScreen={screen} setScreen={setScreen} />
      )}

      {/* ===== ACTIVE ALARM OVERLAY ===== */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-6 animate-[slide-up_0.3s_ease-out] neomorphic-card">

            {/* Pulsing bell icon */}
            <div className="relative flex items-center justify-center mt-2">
              <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-primary/20" />
              <span className="animate-pulse absolute inline-flex h-16 w-16 rounded-full bg-primary/30" />
              <div className="relative w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                <BellRing size={28} className="animate-bounce" />
              </div>
            </div>

            {/* Alarm details */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                Medication Reminder
              </span>
              <h3 className="text-2xl font-bold text-on-surface pt-2 leading-tight">
                {activeAlarm.name}
              </h3>
              <p className="text-on-surface-variant font-medium">
                Dosage: {activeAlarm.dosage}
              </p>
              <p className="text-outline text-xs">
                Scheduled for {formatTime12h(activeAlarm.time)} IST
              </p>
            </div>

            {/* Audio blocked warning */}
            {audioRef.current?.paused && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 flex items-center gap-1.5 justify-center border border-amber-200">
                <Volume2 size={14} /> Click to enable alarm sound
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full mb-2">
              <button
                onClick={handleTakeMedication}
                className="w-full bg-primary text-white py-4 rounded-2xl font-semibold shadow-lg shadow-primary-container/25 hover:bg-primary-container hover:shadow-xl transition-all active:scale-[0.98] text-[16px] flex items-center justify-center gap-2"
              >
                <Check size={20} />
                I've Taken It
              </button>

              <button
                onClick={handleSnoozeAlarm}
                className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] text-[15px]"
              >
                Snooze (5 Minutes)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
