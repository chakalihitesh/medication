import { Pill, RotateCcw, Clock, Camera } from 'lucide-react';
import { Screen, Medication } from '../types';
import { useState, FormEvent } from 'react';

interface AddMedProps {
  setScreen: (s: Screen) => void;
  addMed: (med: Omit<Medication, 'id'>) => void;
}

export function AddMed({ setScreen, addMed }: AddMedProps) {
  const [name, setName] = useState('');
  const [dosageVal, setDosageVal] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [frequency, setFrequency] = useState('Daily');
  const [time, setTime] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !time || !dosageVal) return;

    // Categorize schedule (morning: 6am-12pm, afternoon: 12pm-5pm, evening: 5pm-6am)
    const hour = parseInt(time.split(':')[0], 10);
    let schedule: 'morning' | 'afternoon' | 'evening' = 'morning';
    if (hour >= 12 && hour < 17) {
      schedule = 'afternoon';
    } else if (hour >= 17 || hour < 6) {
      schedule = 'evening';
    }

    const dosage = `${dosageVal} ${dosageUnit}`;

    addMed({
      name,
      time, // HH:MM 24h format directly from type="time"
      dosage,
      status: 'pending',
      schedule
    });

    setScreen('meds');
  };

  return (
    <div className="flex flex-col max-w-md mx-auto relative h-full pt-4">
      <form className="space-y-6 flex flex-col pb-24" onSubmit={handleSubmit}>
        
        {/* Medication Name */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-on-surface-variant">Medication Name</label>
          <div className="relative">
            <Pill className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input 
              type="text" 
              placeholder="e.g. Amoxicillin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-lowest border border-surface-variant rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-colors shadow-sm text-on-surface"
              required
            />
          </div>
        </div>

        {/* Dosage */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-on-surface-variant">Dosage</label>
          <div className="flex space-x-3">
            <input 
              type="number" 
              placeholder="Amount"
              value={dosageVal}
              onChange={(e) => setDosageVal(e.target.value)}
              className="flex-1 bg-surface-container-lowest border border-surface-variant rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-colors shadow-sm text-on-surface"
              required
            />
            <select 
              value={dosageUnit}
              onChange={(e) => setDosageUnit(e.target.value)}
              className="bg-surface-container-lowest border border-surface-variant rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-colors shadow-sm w-1/3 text-on-surface"
            >
              <option value="mg">mg</option>
              <option value="ml">ml</option>
              <option value="pills">pills</option>
              <option value="drops">drops</option>
              <option value="capsules">capsules</option>
            </select>
          </div>
        </div>

        {/* Frequency */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-on-surface-variant">Frequency</label>
          <div className="relative">
            <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full bg-surface-container-lowest border border-surface-variant rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-colors shadow-sm appearance-none text-on-surface"
            >
              <option value="Daily">Daily</option>
              <option value="Twice a Day">Twice a Day</option>
              <option value="Weekly">Weekly</option>
              <option value="As Needed">As Needed</option>
            </select>
          </div>
        </div>

        {/* Reminder Time */}
        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-on-surface-variant">Set Reminder Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-surface-container-lowest border border-surface-variant rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container transition-colors shadow-sm text-on-surface"
              required
            />
          </div>
        </div>

        {/* Upload Prescription */}
        <div className="pt-4">
          <button type="button" className="w-full bg-[#B2EBF2] text-[#00687A] text-sm font-semibold rounded-lg py-4 px-4 flex items-center justify-center space-x-2 border border-transparent shadow-[0_4px_12px_rgba(0,104,122,0.05)] hover:bg-[#A3E4F5] transition-colors active:scale-95">
            <Camera size={20} />
            <span>Upload Prescription</span>
          </button>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-[80px] lg:bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md p-5 border-t border-surface-variant z-40 lg:absolute lg:bg-transparent lg:border-none lg:backdrop-blur-none lg:p-0">
          <button type="submit" className="w-full bg-primary-container text-on-primary rounded-full py-4 text-[17px] font-semibold shadow-[0_4px_12px_rgba(0,82,204,0.15)] hover:opacity-90 active:scale-95 transition-all">
            Save Medication
          </button>
        </div>
      </form>
    </div>
  );
}
