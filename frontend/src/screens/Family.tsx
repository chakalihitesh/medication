import { Heart, Footprints, Moon, Plus } from 'lucide-react';
import { familyMembers } from '../data';
import { cn } from '../lib/utils';

export function Family() {
  return (
    <div className="flex flex-col max-w-md mx-auto relative min-h-screen pb-24 px-5 pt-6">
      <section>
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-xl font-bold text-[#1a1a1a]">Family Status</h2>
          <span className="text-[15px] font-semibold text-[#00687a]">All Normal</span>
        </div>
        <p className="text-[17px] text-[#434654] leading-relaxed mb-6">
          Quick overview of your family's daily health metrics.
        </p>
      </section>

      <section className="space-y-4 flex-1">
        {familyMembers.map((member) => (
          <article key={member.id} className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,82,204,0.04)] p-4 flex flex-row items-center gap-4 hover:shadow-[0_8px_24px_rgba(0,61,155,0.08)] transition-all duration-300">
            <div className="w-[68px] h-[68px] rounded-full overflow-hidden bg-surface-variant flex-shrink-0 border-2 border-surface">
               <img 
                 src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=e1e2e4&color=434654`} 
                 alt={member.name} 
                 className="w-full h-full object-cover" 
               />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-xl font-bold text-[#1a1a1a] truncate">{member.name}</h3>
                <span className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap",
                  member.statusType === 'normal' ? 'bg-[#e3f2f5] text-[#00687a]' : 
                  member.statusType === 'success' ? 'bg-[#e1f0ff] text-[#0052cc]' : 
                  'bg-[#f3f4f6] text-[#4b5563]'
                )}>
                  {member.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#434654] text-[17px] font-medium">
                {member.metricIcon === 'Heart' && <Heart size={20} className={member.statusType === 'normal' ? 'text-[#00687a] fill-current' : ''} />}
                {member.metricIcon === 'Activity' && <Footprints size={20} className={member.statusType === 'success' ? 'text-[#0052cc] fill-current' : ''} />}
                {member.metricIcon === 'Moon' && <Moon size={20} className="text-[#4b5563] fill-current" />}
                <span>{member.metricValue}</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-8">
        <button className="w-full h-[56px] bg-[#003d9b] text-white text-[17px] font-semibold rounded-full shadow-[0_4px_12px_rgba(0,61,155,0.15)] hover:bg-[#002f78] active:scale-95 transition-all flex items-center justify-center gap-2">
          <Plus size={22} strokeWidth={2.5} />
          Add Family Member
        </button>
      </div>
    </div>
  );
}
