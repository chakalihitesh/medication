import { Heart, Footprints, Moon, Search, AlertTriangle } from 'lucide-react';
import { Screen } from '../types';
import { t } from '../lib/translations';

interface HomeProps {
  setScreen: (s: Screen) => void;
}

export function Home({ setScreen }: HomeProps) {
  return (
    <div className="flex flex-col gap-6 pb-24">
      <section className="flex flex-col gap-5 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface leading-snug">{t('welcome', 'Good morning,')}<br/>Alex.</h2>
          <p className="text-on-surface-variant md:mt-1">{t('vitals_activities', 'Here is your daily health summary.')}</p>
        </div>
        
        <button className="bg-sos-red text-white font-bold text-lg py-4 px-6 md:px-8 rounded-full sos-shadow hover:bg-[#B52A09] active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-3 border-4 border-white/20">
          <AlertTriangle size={24} />
          {t('emergency_sos', 'EMERGENCY SOS')}
        </button>
      </section>


      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-min">
        <div className="bg-surface-container-lowest rounded-2xl p-4 neomorphic-card flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
              <Heart size={18} className="text-primary-container" /> {t('heart_rate', 'Heart Rate')}
            </span>
            <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full text-xs font-semibold">Normal</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-on-surface leading-none mt-2">72 <span className="text-base font-normal text-on-surface-variant">bpm</span></div>
            <div className="w-full h-8 mt-2 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDIwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDEwIEwyMCAxMCBMMjUgNSBMMzUgMTUgTDQwIDEwIEwxMDAgMTAiIHN0cm9rZT0iMaphZGhlcmVuY2UiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')] bg-no-repeat bg-center bg-contain"></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 neomorphic-card flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center">
            <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
              <Footprints size={18} className="text-primary-container" /> {t('step_count', 'Steps')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-auto">
            <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-surface-variant">
              <div className="absolute inset-0 rounded-full border-4 border-primary-container border-t-transparent border-r-transparent transform -rotate-45"></div>
              <Footprints size={20} className="text-primary-container" />
            </div>
            <div>
              <div className="text-xl font-bold text-on-surface">8,450</div>
              <div className="text-xs font-semibold text-on-surface-variant">/ 10,000</div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 neomorphic-card flex flex-col justify-between col-span-2 min-h-[140px]">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
              <Moon size={18} className="text-primary-container" /> {t('sleep_quality', 'Sleep')}
            </span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">Good (88%)</span>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-on-surface">7h 20m</div>
                <div className="text-xs font-semibold text-on-surface-variant">Target: 8h 00m</div>
              </div>
              <div className="flex items-end gap-1.5 h-12">
                <div className="w-3 h-[40%] bg-blue-200 rounded-t-sm"></div>
                <div className="w-3 h-[75%] bg-primary-container rounded-t-sm"></div>
                <div className="w-3 h-[25%] bg-secondary-container rounded-t-sm"></div>
                <div className="w-3 h-[60%] bg-primary-container rounded-t-sm"></div>
                <div className="w-3 h-[45%] bg-blue-200 rounded-t-sm"></div>
                <div className="w-3 h-[30%] bg-secondary-container rounded-t-sm"></div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-surface-variant/30">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary-container"></div><span className="text-[11px] font-medium text-on-surface-variant">Deep (2h)</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-200"></div><span className="text-[11px] font-medium text-on-surface-variant">Light (4h)</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-secondary-container"></div><span className="text-[11px] font-medium text-on-surface-variant">REM (1h 20m)</span></div>
            </div>
          </div>
        </div>

        <div onClick={() => setScreen('assistant')} className="bg-gradient-to-br from-surface-container-lowest to-secondary-fixed/20 rounded-2xl p-4 neomorphic-card border-secondary-fixed-dim/30 flex flex-col col-span-2 md:col-span-4 min-h-[140px] relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-3 z-10">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shadow-sm">
              <Moon className="text-on-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">{t('chat_with_ai', 'Chat with HealthMate AI')}</h3>
              <p className="text-sm text-on-surface-variant">{t('choose_language', 'Ask about symptoms, meds, or reports.')}</p>
            </div>
          </div>
          <div className="mt-auto z-10 w-full">
            <div className="bg-surface-container-lowest inset-0 rounded-full border border-surface-variant px-3 py-2 flex items-center gap-2 text-on-surface-variant opacity-70 group-hover:opacity-100 transition-opacity">
              <Search size={20} />
              <span className="text-base relative w-full overflow-hidden whitespace-nowrap">{t('assistant_title', 'How are my vitals looking?')}</span>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
