import { Bot, Send, AlertTriangle, Info } from 'lucide-react';

export function Assistant() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative bg-surface">
      
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-40 flex flex-col gap-6 relative z-10 hide-scrollbar">
        <div className="flex justify-center w-full">
          <span className="bg-surface-container text-on-surface-variant text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Today, 9:41 AM
          </span>
        </div>

        <div className="flex items-start gap-3 max-w-[90%]">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
            <Bot size={20} className="text-on-secondary" />
          </div>
          <div className="bg-secondary-container text-on-secondary-container p-4 rounded-2xl rounded-tl-[4px] shadow-[0_4px_12px_rgba(0,104,122,0.08)]">
            <p className="text-base">Hello Alex! I've reviewed your heart rate data from this morning. Everything looks within your normal range. Is there anything else you'd like to discuss?</p>
          </div>
        </div>

        <div className="flex items-start gap-3 max-w-[90%] self-end justify-end">
          <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-tr-[4px] shadow-[0_4px_12px_rgba(0,82,204,0.15)]">
            <p className="text-base">How does my step count compare to last week?</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[80px] lg:bottom-0 left-0 w-full bg-surface-container-lowest pt-3 pb-4 px-5 z-40 rounded-t-2xl shadow-[0_-8px_24px_rgba(0,82,204,0.06)] border-t border-surface-variant">
        <div className="text-center mb-3">
          <p className="text-xs font-semibold text-on-surface-variant flex items-center justify-center gap-1 tracking-wide">
            <Info size={14} />
            I am an AI, not a doctor. In an emergency, please use the SOS button.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-error text-on-error h-12 px-4 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(186,26,26,0.2)] hover:bg-[#a01616] active:scale-95 transition-all duration-200">
            <AlertTriangle size={20} />
            <span className="text-sm font-bold">SOS</span>
          </button>
          
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Message HealthMate..."
              className="w-full h-12 bg-surface rounded-full pl-4 pr-12 border border-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base text-on-surface placeholder:text-outline transition-all shadow-[inset_1px_1px_4px_rgba(0,0,0,0.05),inset_-1px_-1px_4px_rgba(255,255,255,0.8)]"
            />
            <button className="absolute right-1 top-1 w-10 h-10 flex items-center justify-center text-primary hover:bg-primary-fixed rounded-full transition-colors active:scale-90">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
