import { User, Contact, Activity, Calendar, ChevronDown } from 'lucide-react';
import { currentUser } from '../data';
import { Screen } from '../types';

interface EditProfileProps {
  setScreen?: (screen: Screen) => void;
}

export function EditProfile({ setScreen }: EditProfileProps) {
  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto relative pb-8 h-full">
      
      {/* Physical Metrics */}
      <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,82,204,0.04)] p-5 border border-outline-variant/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[#0052cc]">
            <Activity size={20} strokeWidth={2.5}/>
          </div>
          <h3 className="text-[17px] font-medium text-on-surface">Physical Metrics</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-[#f2f4f6] rounded-xl flex flex-col px-4 py-3 border border-transparent focus-within:border-[#0052cc] focus-within:bg-white transition-colors">
            <label className="text-[12px] font-medium text-on-surface-variant tracking-wider uppercase mb-1">Height (cm)</label>
            <input 
              type="number" 
              defaultValue="180" 
              className="bg-transparent border-none p-0 focus:ring-0 text-[#0052cc] text-xl font-medium w-full"
            />
          </div>
          <div className="bg-[#f2f4f6] rounded-xl flex flex-col px-4 py-3 border border-transparent focus-within:border-[#0052cc] focus-within:bg-white transition-colors">
             <label className="text-[12px] font-medium text-on-surface-variant tracking-wider uppercase mb-1">Weight (kg)</label>
             <input 
              type="number" 
              defaultValue="75" 
              className="bg-transparent border-none p-0 focus:ring-0 text-[#0052cc] text-xl font-medium w-full"
            />
          </div>
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
          <div className="flex flex-col gap-1.5 border border-outline-variant/40 rounded-xl focus-within:border-[#0052cc] transition-colors overflow-hidden">
            <div className="px-3 pt-2">
               <label className="text-[12px] text-on-surface-variant">Full Name</label>
            </div>
            <input type="text" defaultValue={currentUser.name} className="w-full h-10 px-3 pb-2 bg-transparent border-none focus:ring-0 text-on-surface text-base" />
          </div>
          
          <div className="flex flex-col gap-1.5 border border-outline-variant/40 rounded-xl focus-within:border-[#0052cc] transition-colors relative overflow-hidden">
             <div className="px-3 pt-2">
               <label className="text-[12px] text-on-surface-variant">Date of Birth</label>
            </div>
            <input type="date" defaultValue="1990-05-15" className="w-full h-10 px-3 pb-2 bg-transparent border-none focus:ring-0 text-on-surface text-base" />
          </div>

          <div className="flex flex-col gap-1.5 border border-outline-variant/40 rounded-xl focus-within:border-[#0052cc] transition-colors relative overflow-hidden">
            <div className="px-3 pt-2">
               <label className="text-[12px] text-on-surface-variant">Gender</label>
            </div>
            <select defaultValue="Male" className="w-full h-10 pl-3 pr-8 pb-2 bg-transparent border-none focus:ring-0 text-on-surface text-base appearance-none">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <div className="absolute right-3 top-5 pointer-events-none text-on-surface-variant">
              <ChevronDown size={18} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border border-outline-variant/40 rounded-xl focus-within:border-[#0052cc] transition-colors relative overflow-hidden">
             <div className="px-3 pt-2">
               <label className="text-[12px] text-on-surface-variant">Blood Type</label>
            </div>
            <select defaultValue="O+" className="w-full h-10 pl-3 pr-8 pb-2 bg-transparent border-none focus:ring-0 text-on-surface text-base appearance-none">
              <option>O+</option>
              <option>O-</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
            </select>
             <div className="absolute right-3 top-5 pointer-events-none text-on-surface-variant">
              <ChevronDown size={18} />
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
           <div className="flex flex-col gap-1.5 border border-outline-variant/40 rounded-xl focus-within:border-[#0052cc] transition-colors overflow-hidden">
            <div className="px-3 pt-2">
               <label className="text-[12px] text-on-surface-variant">Email Address</label>
            </div>
            <input type="email" defaultValue={currentUser.email} className="w-full h-10 px-3 pb-2 bg-transparent border-none focus:ring-0 text-on-surface text-base" />
          </div>
          
          <div className="flex flex-col gap-1.5 border border-outline-variant/40 rounded-xl focus-within:border-[#0052cc] transition-colors overflow-hidden">
            <div className="px-3 pt-2">
               <label className="text-[12px] text-on-surface-variant">Phone Number</label>
            </div>
            <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full h-10 px-3 pb-2 bg-transparent border-none focus:ring-0 text-on-surface text-base" />
          </div>
        </div>
      </div>

      <div className="mt-4 pb-12">
        <button 
          onClick={() => setScreen?.('profile')}
          className="w-full h-[56px] bg-[#003d9b] text-white text-[17px] font-semibold rounded-full shadow-[0_4px_12px_rgba(0,61,155,0.15)] hover:bg-[#002f78] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}
