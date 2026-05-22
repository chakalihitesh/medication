import { User, Contact, Activity, Calendar, ChevronDown } from 'lucide-react';
import { currentUser } from '../data';

export function PersonalInfo() {
  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto relative pb-24 h-full">
      
      {/* Physical Metrics */}
      <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,82,204,0.04)] p-5 border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[#0052cc]">
            <Activity size={20} strokeWidth={2.5}/>
          </div>
          <h3 className="text-[17px] font-medium text-on-surface">Physical Metrics</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-[#f2f4f6] rounded-xl flex flex-col items-center justify-center py-4">
            <span className="text-[13px] font-medium text-on-surface-variant tracking-wider uppercase mb-1">Height</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[#0052cc] text-xl font-medium">180</span>
              <span className="text-[#434654] text-sm font-medium">cm</span>
            </div>
          </div>
          <div className="bg-[#f2f4f6] rounded-xl flex flex-col items-center justify-center py-4">
            <span className="text-[13px] font-medium text-on-surface-variant tracking-wider uppercase mb-1">Weight</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[#0052cc] text-xl font-medium">75</span>
              <span className="text-[#434654] text-sm font-medium">kg</span>
            </div>
          </div>
        </div>

        <div className="bg-[#f2f4f6] rounded-xl p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-on-surface-variant tracking-wider uppercase mb-0.5">BMI</span>
            <span className="text-xl font-medium text-on-surface">23.1</span>
          </div>
          <span className="bg-[#e3f2f5] text-[#00687a] text-[15px] font-medium px-4 py-1.5 rounded-full">
            Normal
          </span>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,82,204,0.04)] p-5 border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-variant/30">
          <div className="text-[#0052cc]">
            <User size={20} strokeWidth={2.5}/>
          </div>
          <h3 className="text-[17px] font-medium text-on-surface">Personal Information</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] text-on-surface-variant">Full Name</label>
            <div className="w-full h-12 bg-white border border-outline-variant/40 rounded-xl px-4 flex items-center">
              <span className="text-on-surface text-base">{currentUser.name}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] text-on-surface-variant">Date of Birth</label>
            <div className="w-full h-12 bg-white border border-outline-variant/40 rounded-xl px-4 flex items-center justify-between">
              <span className="text-on-surface text-base">15-05-1990</span>
              <Calendar size={18} className="text-on-surface-variant" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] text-on-surface-variant">Gender</label>
            <div className="w-full h-12 bg-white border border-outline-variant/40 rounded-xl px-4 flex items-center justify-between">
              <span className="text-on-surface text-base">Male</span>
              <ChevronDown size={18} className="text-on-surface-variant" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] text-on-surface-variant">Blood Type</label>
            <div className="w-full h-12 bg-white border border-outline-variant/40 rounded-xl px-4 flex items-center justify-between">
              <span className="text-on-surface text-base">O+</span>
              <ChevronDown size={18} className="text-on-surface-variant" />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,82,204,0.04)] p-5 border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-variant/30">
          <div className="text-[#0052cc]">
            <Contact size={20} strokeWidth={2.5}/>
          </div>
          <h3 className="text-[17px] font-medium text-on-surface">Contact Information</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] text-on-surface-variant">Email Address</label>
            <div className="w-full h-12 bg-white border border-outline-variant/40 rounded-xl px-4 flex items-center">
              <span className="text-on-surface text-base">{currentUser.email}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] text-on-surface-variant">Phone Number</label>
            <div className="w-full h-12 bg-white border border-outline-variant/40 rounded-xl px-4 flex items-center">
              <span className="text-on-surface text-base">+1 (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
