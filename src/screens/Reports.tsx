import { Footprints, Heart, Moon, Download } from 'lucide-react';

export function Reports() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24 h-full overflow-y-auto">
      
      <div className="flex flex-col gap-3">
        <h2 className="text-4xl font-bold text-on-surface tracking-tight">Health Insights</h2>
        <p className="text-base text-on-surface-variant">Here is a summary of your vitals and activities.</p>
      </div>

      <div className="bg-surface-container rounded-lg p-1 flex shadow-inner border border-surface-variant/50">
        <button className="flex-1 py-2 bg-surface rounded-md shadow-[0_2px_8px_rgba(0,61,155,0.08)] text-sm font-medium text-primary text-center transition-all">Weekly</button>
        <button className="flex-1 py-2 text-sm font-medium text-on-surface-variant text-center hover:text-on-surface transition-colors">Monthly</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,61,155,0.04)] border border-surface-variant/30 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1 text-secondary mb-1">
                <Footprints size={20} />
                <span className="text-sm font-medium uppercase tracking-wider">Step Count</span>
              </div>
              <div className="text-3xl font-bold text-on-surface">42,850 <span className="text-base font-normal text-on-surface-variant">steps total</span></div>
            </div>
            <div className="inline-flex px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
              +12% vs last week
            </div>
          </div>
          
          <div className="h-48 w-full mt-2 relative flex items-end justify-between px-2 pb-6 border-b border-surface-variant border-dashed">
            {/* Visual Bars Mock */}
            <div className="w-[10%] bg-primary/20 hover:bg-primary/40 rounded-t-md h-[40%] cursor-pointer transition-colors relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100">4.2k</div>
            </div>
            <div className="w-[10%] bg-primary/30 hover:bg-primary/50 transition-colors rounded-t-md h-[60%] relative group cursor-pointer"></div>
            <div className="w-[10%] bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-md h-[50%] relative group cursor-pointer"></div>
            <div className="w-[10%] bg-primary/40 hover:bg-primary/60 transition-colors rounded-t-md h-[80%] relative group cursor-pointer"></div>
            <div className="w-[10%] bg-primary/30 hover:bg-primary/50 transition-colors rounded-t-md h-[70%] relative group cursor-pointer"></div>
            <div className="w-[10%] bg-secondary/80 hover:bg-secondary transition-colors rounded-t-md h-[95%] relative group cursor-pointer shadow-[0_0_12px_rgba(0,104,122,0.4)]">
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-xs font-semibold px-2 py-1 rounded">9.5k</div>
            </div>
            <div className="w-[10%] bg-primary/10 hover:bg-primary/30 transition-colors rounded-t-md h-[30%] relative group cursor-pointer"></div>
            
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs font-semibold text-on-surface-variant translate-y-full pt-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span className="text-secondary font-bold">Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,61,155,0.04)] border border-surface-variant/30 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-tertiary-container/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-2 text-tertiary">
            <Heart size={24} />
            <span className="text-sm font-medium uppercase tracking-wide">Avg Heart Rate</span>
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-3xl font-bold text-on-surface leading-none">
              72 <span className="text-base font-normal text-on-surface-variant">bpm</span>
            </div>
            <div className="inline-flex px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
              Normal
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,61,155,0.04)] border border-surface-variant/30 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary-container/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-2 text-primary">
            <Moon size={24} />
            <span className="text-sm font-medium uppercase tracking-wide">Sleep Quality Score</span>
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-3xl font-bold text-on-surface leading-none">
              85 <span className="text-base font-normal text-on-surface-variant">/100</span>
            </div>
            <div className="inline-flex px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
              Restful
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button className="w-full h-12 bg-primary text-on-primary rounded-full text-xl font-semibold flex justify-center items-center gap-3 shadow-[0_4px_12px_rgba(0,61,155,0.15)] hover:bg-surface-tint active:scale-[0.98] transition-all">
          <Download size={24} /> Download PDF Report
        </button>
      </div>

    </div>
  );
}
