import { useState } from 'react';
import { User, Users, Edit2, BookOpen, HelpCircle, LogOut, ChevronRight, BadgeCheck, Camera, Eye, X } from 'lucide-react';
import { currentUser } from '../data';
import { Screen } from '../types';

interface ProfileProps {
  setScreen?: (screen: Screen) => void;
}

export function Profile({ setScreen }: ProfileProps) {
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24 h-full overflow-y-auto px-5 pt-6 relative">
      
      {/* Profile Card */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_20px_rgba(0,61,155,0.06)] flex items-center gap-4 animate-[slide-up-fade_0.6s_ease-out_forwards]">
        <button 
          onClick={() => setShowPhotoOptions(true)}
          className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-4 border-surface shadow-sm relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK1t0-KuE7Mb6VWVSfGYsU2vu0zaWRMKB7PTC8YDSkpl0ObDQNSgkqjsMfUgDl1Up63g6MRwpABu3ELST9JzkO9qcqDNk77Gs_80sP_CJJjM8_ofFVRqcaSvbv2SrxzPErW3wsCs29SXNQoBTWb6XDqyPCQs6Iw8OwtZcZutZ4_z4z2JIQbtDSgYiyKoaUwgn79uL0dmneQMKHnuqIGvcJYi3t-x14uW_ODkjaKoZ-3d-mIPmaGcWdPNpuV0GnQZRmSx5BdH9vXq4" 
            alt="Alex Johnson" 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white fill-current w-6 h-6" />
          </div>
        </button>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-on-surface leading-tight tracking-tight">{currentUser.name}</h2>
          {currentUser.isPremium && (
            <div className="flex items-center gap-1.5 mt-0.5 mb-1.5 text-primary">
              <span className="text-[14px] font-semibold tracking-wide">Premium Member</span>
              <BadgeCheck size={18} className="text-primary" strokeWidth={2.5}/>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 bg-secondary-container/20 px-2.5 py-0.5 rounded-full w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Active Status</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-on-surface-variant tracking-widest uppercase ml-2 opacity-70">
          Account Settings
        </h3>
        
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,61,155,0.04)] overflow-hidden flex flex-col divide-y divide-surface-variant/30">
          
          <button 
            type="button"
            onClick={() => setScreen?.('personal-info')}
            className="flex items-center p-4 w-full text-left hover:bg-surface-container-low transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <User size={22} className="fill-current" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base text-on-surface font-medium group-hover:text-primary transition-colors">Personal Info</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            type="button" 
            onClick={() => setScreen?.('family')}
            className="flex items-center p-4 w-full text-left hover:bg-surface-container-low transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <Users size={22} className="fill-current" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base text-on-surface font-medium group-hover:text-primary transition-colors">Family Health</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            type="button"
            onClick={() => setScreen?.('edit-profile')}
            className="flex items-center p-4 w-full text-left hover:bg-surface-container-low transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed/30 flex items-center justify-center text-secondary shrink-0 group-hover:scale-110 transition-transform">
              <Edit2 size={22} className="fill-current" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base text-on-surface font-medium group-hover:text-secondary transition-colors">Edit Profile</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="flex items-center p-4 w-full text-left hover:bg-surface-container-low transition-all active:scale-[0.98] group">
            <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/30 flex items-center justify-center text-tertiary shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen size={22} className="fill-current" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base text-on-surface font-medium group-hover:text-tertiary transition-colors">Guidelines</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>

          <button className="flex items-center p-4 w-full text-left hover:bg-surface-container-low transition-all active:scale-[0.98] group">
            <div className="w-10 h-10 rounded-xl bg-outline-variant/20 flex items-center justify-center text-on-surface-variant shrink-0 group-hover:scale-110 transition-transform">
              <HelpCircle size={22} className="fill-current" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-base text-on-surface font-medium">Help & Support</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </div>

      <button className="mt-4 mb-8 w-full bg-surface-container-lowest text-error font-semibold text-xl py-4 rounded-xl shadow-[0_4px_12px_rgba(186,26,26,0.08)] border border-error/10 flex items-center justify-center gap-3 hover:bg-error-container/10 active:scale-[0.97] transition-all">
         <LogOut size={24} />
         <span>Log Out</span>
      </button>

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white w-full max-w-sm rounded-[24px] p-5 shadow-2xl animate-[slide-up_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-[#1a1a1a]">Profile Photo</h3>
              <button onClick={() => setShowPhotoOptions(false)} className="p-2 bg-[#f3f4f6] rounded-full hover:bg-[#e1e2e4] active:scale-95 transition-all text-[#4b5563]">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowPhotoOptions(false)}
                className="w-full flex items-center gap-4 p-4 rounded-[16px] bg-[#f8f9fb] hover:bg-[#e1f0ff] active:scale-[0.98] transition-all group border border-transparent hover:border-[#b2c5ff]"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#0052cc] shadow-[0_2px_8px_rgba(0,82,204,0.08)] group-hover:scale-110 transition-transform">
                  <Eye size={22} className="fill-current" />
                </div>
                <span className="text-[17px] font-semibold text-[#1a1a1a] group-hover:text-[#0052cc] transition-colors">See Photo</span>
              </button>

              <button 
                onClick={() => setShowPhotoOptions(false)}
                className="w-full flex items-center gap-4 p-4 rounded-[16px] bg-[#f8f9fb] hover:bg-[#e3f2f5] active:scale-[0.98] transition-all group border border-transparent hover:border-[#6ae1ff]"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#00687a] shadow-[0_2px_8px_rgba(0,104,122,0.08)] group-hover:scale-110 transition-transform">
                  <Camera size={22} className="fill-current" />
                </div>
                <span className="text-[17px] font-semibold text-[#1a1a1a] group-hover:text-[#00687a] transition-colors">Change Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
