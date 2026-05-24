import { Fingerprint } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container-lowest p-5">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="w-32 h-32 flex items-center justify-center mb-6">
           <img 
              src="https://lh3.googleusercontent.com/aida/ADBb0uihaNjYxUo8bCHuY0kj6i2I1ZSNwN4-TfcE4GWjwZ-XeYyCv3rvY2uD5A7Y8-lTjcuE5-WafPzqvnYEIKQFkRJC3kjK2u5QdXRNh0pPeHEkiDAr8-S2IZ4_mfqI03bwwHJANYWhxXI02tiWpgiwptKnSXxR6lpUGniiIejgGsW5LgzoFpy2VUfK6-q9hFMgUqH9s4xuu-EWZH91EbNgqqCnuVtF5iRSNWGm_VXfSP3f6HOJdIXNxtD7mcU" 
              alt="HealthMate AI Logo" 
              className="w-full h-full object-contain" 
           />
        </div>
        
        <h1 className="text-3xl font-semibold text-[#1a1a1a] text-center mb-2 leading-tight">
          Welcome back to<br/>HealthMate
        </h1>
        <p className="text-[#434654] text-center mb-8">
          Please enter your details to sign in securely.
        </p>

        <form className="w-full flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[15px] font-medium text-[#1a1a1a]">Email Address</label>
            <input 
              type="email" 
              className="w-full h-[48px] px-4 bg-[#f8f9fb] border border-[#d1d5db] rounded-lg text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
              placeholder="name@example.com" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[15px] font-medium text-[#1a1a1a]">Password</label>
              <a href="#" className="text-sm font-semibold text-[#0052cc] hover:opacity-80">Forgot password?</a>
            </div>
            <input 
              type="password" 
              className="w-full h-[48px] px-4 bg-[#f8f9fb] border border-[#d1d5db] rounded-lg text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tracking-[0.2em]" 
              placeholder="••••••••" 
            />
          </div>

          <button type="submit" className="w-full h-[52px] mt-2 bg-[#003d9b] text-white font-semibold rounded-full flex items-center justify-center hover:bg-[#002f78] active:scale-[0.98] transition-all">
            Login
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="h-[1px] bg-[#d1d5db] flex-1"></div>
            <span className="text-sm font-medium text-[#6b7280]">OR</span>
            <div className="h-[1px] bg-[#d1d5db] flex-1"></div>
          </div>

          <button type="button" onClick={onLogin} className="w-full h-[52px] bg-[#e3f2f5] text-[#00687a] font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbe8ec] active:scale-[0.98] transition-all">
            <Fingerprint className="w-5 h-5" />
            Secure Login with Biometrics
          </button>
        </form>

        <p className="text-[#434654] mt-8 text-center text-[15px]">
          Don't have an account? <a href="#" className="text-[#0052cc] font-medium ml-1">Sign Up</a>
        </p>
      </div>
    </div>
  );
}

