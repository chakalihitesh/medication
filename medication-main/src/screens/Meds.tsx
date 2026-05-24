import { Plus, Check, Clock, ShieldCheck, Pill, Trash2 } from 'lucide-react';
import { Screen, Medication } from '../types';
import { cn, formatTime12h } from '../lib/utils';
import { t } from '../lib/translations';

interface MedsProps {
  setScreen: (s: Screen) => void;
  meds: Medication[];
  toggleMed: (id: string) => void;
  deleteMed?: (id: string) => void;
}

export function Meds({ setScreen, meds, toggleMed, deleteMed }: MedsProps) {
  const takenCount = meds.filter(m => m.status === 'taken').length;

  const morningMeds = meds.filter(m => m.schedule === 'morning');
  const afternoonMeds = meds.filter(m => m.schedule === 'afternoon');
  const eveningMeds = meds.filter(m => m.schedule === 'evening');

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-140px)] pb-24">
      
      {/* Progress Cards */}
      <section className="grid grid-cols-2 gap-4">
        <div className="neomorphic-card rounded-2xl p-4 flex flex-col justify-center items-start">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{t('adherence', "Today's Adherence")}</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-primary">{takenCount}/{meds.length}</span>
            <span className="text-base text-outline pb-1">{t('taken', 'Taken')}</span>
          </div>
        </div>
        
        <div className="neomorphic-card rounded-xl p-4 flex flex-col justify-center items-start bg-secondary-container/20">
          <div className="flex items-center gap-1 mb-1 text-secondary">
            <ShieldCheck size={20} />
            <p className="text-xs font-semibold uppercase tracking-wider">{t('status', 'Status')}</p>
          </div>
          <p className="text-xl font-semibold text-on-surface">
            {takenCount === meds.length && meds.length > 0 ? t('taken', 'Completed') : t('pending', 'On Track')}
          </p>
        </div>
      </section>


      {/* Medication Schedule Lists */}
      <section className="flex flex-col gap-4">
        
        {/* Morning Section */}
        {morningMeds.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-on-surface px-1">{t('morning', 'Morning')} {t('schedule', 'Schedule')}</h2>
            {morningMeds.map((med) => (
              <article key={med.id} className="neomorphic-card rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1", 
                  med.status === 'taken' ? "bg-secondary opacity-50" : "bg-primary"
                )}></div>
                <div className={cn(
                  "flex-shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center",
                  med.status === 'taken' ? "bg-[#cbe8ec]" : "bg-[#e1f0ff]"
                )}>
                  <Pill size={24} className={med.status === 'taken' ? "text-[#00687a]" : "text-primary"} />
                </div>
                <div className="flex-grow">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    med.status === 'taken' ? "text-on-surface line-through opacity-60" : "text-on-surface"
                  )}>{med.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-on-surface-variant opacity-80">
                    <span className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      med.status === 'pending' && "text-primary"
                    )}>
                      <Clock size={16} /> {formatTime12h(med.time)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="text-sm">{med.dosage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {deleteMed && (
                    <button 
                      onClick={() => deleteMed(med.id)}
                      className="p-2 text-outline hover:text-error hover:bg-error-container/20 rounded-full transition-colors mr-1"
                      title="Delete Medication"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => toggleMed(med.id)}
                    className="relative flex items-center justify-center p-2 rounded-full hover:bg-surface-variant transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                      med.status === 'taken' ? "border-primary bg-primary" : "border-outline-variant bg-transparent"
                    )}>
                      <Check size={20} className={cn(
                        "text-white transition-opacity",
                        med.status === 'taken' ? "opacity-100" : "opacity-0"
                      )} />
                    </div>
                  </button>
                </div>
              </article>
            ))}
          </>
        )}

        {/* Afternoon Section */}
        {afternoonMeds.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-on-surface px-1 mt-4">{t('afternoon', 'Afternoon')} {t('schedule', 'Schedule')}</h2>
            {afternoonMeds.map((med) => (
              <article key={med.id} className="neomorphic-card rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1", 
                  med.status === 'taken' ? "bg-secondary opacity-50" : "bg-primary"
                )}></div>
                <div className={cn(
                  "flex-shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center",
                  med.status === 'taken' ? "bg-[#cbe8ec]" : "bg-[#e1f0ff]"
                )}>
                  <Pill size={24} className={med.status === 'taken' ? "text-[#00687a]" : "text-primary"} />
                </div>
                <div className="flex-grow">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    med.status === 'taken' ? "text-on-surface line-through opacity-60" : "text-on-surface"
                  )}>{med.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-on-surface-variant opacity-80">
                    <span className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      med.status === 'pending' && "text-primary"
                    )}>
                      <Clock size={16} /> {formatTime12h(med.time)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="text-sm">{med.dosage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {deleteMed && (
                    <button 
                      onClick={() => deleteMed(med.id)}
                      className="p-2 text-outline hover:text-error hover:bg-error-container/20 rounded-full transition-colors mr-1"
                      title="Delete Medication"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => toggleMed(med.id)}
                    className="relative flex items-center justify-center p-2 rounded-full hover:bg-surface-variant transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                      med.status === 'taken' ? "border-primary bg-primary" : "border-outline-variant bg-transparent"
                    )}>
                      <Check size={20} className={cn(
                        "text-white transition-opacity",
                        med.status === 'taken' ? "opacity-100" : "opacity-0"
                      )} />
                    </div>
                  </button>
                </div>
              </article>
            ))}
          </>
        )}

        {/* Evening Section */}
        {eveningMeds.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-on-surface px-1 mt-4">{t('evening', 'Evening')} {t('schedule', 'Schedule')}</h2>
            {eveningMeds.map((med) => (
              <article key={med.id} className="neomorphic-card rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                 <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1", 
                  med.status === 'taken' ? "bg-secondary opacity-50" : "bg-primary"
                )}></div>
                <div className={cn(
                  "flex-shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center",
                  med.status === 'taken' ? "bg-[#cbe8ec]" : "bg-[#e1f0ff]"
                )}>
                  <Pill size={24} className={med.status === 'taken' ? "text-[#00687a]" : "text-primary"} />
                </div>
                <div className="flex-grow">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    med.status === 'taken' ? "text-on-surface line-through opacity-60" : "text-on-surface"
                  )}>{med.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-on-surface-variant opacity-80">
                    <span className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      med.status === 'pending' && "text-primary"
                    )}>
                      <Clock size={16} /> {formatTime12h(med.time)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="text-sm">{med.dosage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {deleteMed && (
                    <button 
                      onClick={() => deleteMed(med.id)}
                      className="p-2 text-outline hover:text-error hover:bg-error-container/20 rounded-full transition-colors mr-1"
                      title="Delete Medication"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => toggleMed(med.id)}
                    className="relative flex items-center justify-center p-2 rounded-full hover:bg-surface-variant transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                      med.status === 'taken' ? "border-primary bg-primary" : "border-outline-variant bg-transparent"
                    )}>
                      <Check size={20} className={cn(
                        "text-white transition-opacity",
                        med.status === 'taken' ? "opacity-100" : "opacity-0"
                      )} />
                    </div>
                  </button>
                </div>
              </article>
            ))}
          </>
        )}

        {/* Empty State */}
        {meds.length === 0 && (
          <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl neomorphic-card p-6">
            <Pill size={48} className="text-outline mx-auto opacity-40 mb-3 animate-[pulse_2s_infinite]" />
            <h3 className="text-lg font-bold text-on-surface mb-1">{t('no_meds_scheduled', 'No Medications Scheduled')}</h3>
            <p className="text-sm text-on-surface-variant">{t('no_meds_desc', 'Tap the "+" button below to add your first medicine reminder.')}</p>
          </div>
        )}

      </section>

      {/* Add Button */}
      <button 
        onClick={() => setScreen('add-med')}
        className="fixed right-5 bottom-[100px] w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,82,204,0.3)] hover:bg-primary-container active:scale-95 transition-all z-40 group lg:absolute"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
