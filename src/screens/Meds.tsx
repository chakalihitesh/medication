import { Plus, Check, Clock, ShieldCheck, Pill } from 'lucide-react';
import { Screen } from '../types';
import { currentMeds } from '../data';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface MedsProps {
  setScreen: (s: Screen) => void;
}

export function Meds({ setScreen }: MedsProps) {
  const [meds, setMeds] = useState(currentMeds);

  const toggleMed = (id: string) => {
    setMeds(meds.map(m => m.id === id ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' } : m));
  };

  const takenCount = meds.filter(m => m.status === 'taken').length;

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-140px)] pb-24">
      <section className="grid grid-cols-2 gap-4">
        <div className="neomorphic-card rounded-2xl p-4 flex flex-col justify-center items-start">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Today's Progress</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-primary">{takenCount}/{meds.length}</span>
            <span className="text-base text-outline pb-1">Taken</span>
          </div>
        </div>
        
        <div className="neomorphic-card rounded-xl p-4 flex flex-col justify-center items-start bg-secondary-container/20">
          <div className="flex items-center gap-1 mb-1 text-secondary">
            <ShieldCheck size={20} />
            <p className="text-xs font-semibold uppercase tracking-wider">Status</p>
          </div>
          <p className="text-xl font-semibold text-on-surface">On Track</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-on-surface px-1">Morning Schedule</h2>
        
        {meds.filter(m => m.schedule === 'morning').map((med) => (
          <article key={med.id} className="neomorphic-card rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1", 
              med.status === 'taken' ? "bg-secondary opacity-50" : "bg-primary"
            )}></div>
            <div className={cn(
              "flex-shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center",
              med.status === 'taken' ? "bg-[#cbe8ec]" : "bg-[#e1f0ff]"
            )}>
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
                  <Clock size={16} /> {med.time}
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="text-sm">{med.dosage}</span>
              </div>
            </div>
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
          </article>
        ))}

        <h2 className="text-xl font-semibold text-on-surface px-1 mt-4">Evening Schedule</h2>
        
        {meds.filter(m => m.schedule === 'evening').map((med) => (
          <article key={med.id} className="neomorphic-card rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
             <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1", 
              med.status === 'taken' ? "bg-secondary opacity-50" : "bg-primary"
            )}></div>
            <div className={cn(
              "flex-shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center",
              med.status === 'taken' ? "bg-[#cbe8ec]" : "bg-[#e1f0ff]"
            )}>
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
                  <Clock size={16} /> {med.time}
                </span>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <span className="text-sm">{med.dosage}</span>
              </div>
            </div>
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
          </article>
        ))}
      </section>

      <button 
        onClick={() => setScreen('add-med')}
        className="fixed right-5 bottom-[100px] w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,82,204,0.3)] hover:bg-primary-container active:scale-95 transition-all z-40 group lg:absolute"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
