import { useState, FormEvent } from 'react';
import { Fingerprint, ArrowLeft, Mail, Lock, Key, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface LoginProps {
  onLogin: (email: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [step, setStep] = useState<'signin' | 'signup' | 'verify_otp' | 'create_password'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setError('');
    setInfo('');
    setLoading(false);
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    resetState();
    setLoading(true);
    try {
      await api.login(email, password);
      onLogin(email);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }
    resetState();
    setLoading(true);
    try {
      await api.sendOtp(email);
      setInfo('A verification OTP has been dispatched to your email.');
      setStep('verify_otp');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    resetState();
    setLoading(true);
    try {
      await api.verifyOtp(email, otp);
      setInfo('Email address successfully verified.');
      setStep('create_password');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    resetState();
    setLoading(true);
    try {
      await api.registerPassword(email, newPassword);
      setInfo('Account created successfully! Please sign in with your email and password.');
      setStep('signin');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to register your password.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container-lowest p-5">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Logo and branding */}
        <div className="w-24 h-24 flex items-center justify-center mb-5">
          <img 
            src="/logo.svg" 
            alt="HealthMate AI Logo" 
            className="w-full h-full object-contain" 
          />
        </div>

        {/* Global state messages */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="w-full mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {/* Tab selection */}
        {(step === 'signin' || step === 'signup') && (
          <div className="flex w-full bg-[#f1f5f9] p-1 rounded-full mb-6 border border-[#e2e8f0]">
            <button
              onClick={() => { resetState(); setStep('signin'); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${
                step === 'signin'
                  ? 'bg-white text-[#003d9b] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { resetState(); setStep('signup'); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${
                step === 'signup'
                  ? 'bg-white text-[#003d9b] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Step: SIGN IN */}
        {step === 'signin' && (
          <div className="w-full flex flex-col items-center">
            <h1 className="text-3xl font-bold text-[#1a1a1a] text-center mb-2 leading-tight">
              Welcome back
            </h1>
            <p className="text-[#434654] text-center mb-6">
              Sign in securely to access your health profile.
            </p>

            <form className="w-full flex flex-col gap-4" onSubmit={handleSignIn}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#1a1a1a] flex items-center gap-1">
                  <Mail className="w-4 h-4 text-[#6b7280]" /> Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[48px] px-4 bg-[#f8f9fb] border border-[#d1d5db] rounded-xl text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  placeholder="name@example.com" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[14px] font-semibold text-[#1a1a1a] flex items-center gap-1">
                    <Lock className="w-4 h-4 text-[#6b7280]" /> Password
                  </label>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[48px] px-4 bg-[#f8f9fb] border border-[#d1d5db] rounded-xl text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tracking-[0.2em]" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[52px] mt-2 bg-[#003d9b] text-white font-semibold rounded-full flex items-center justify-center hover:bg-[#002f78] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </button>

              <div className="flex items-center gap-4 my-1">
                <div className="h-[1px] bg-[#d1d5db] flex-1"></div>
                <span className="text-sm font-medium text-[#6b7280]">OR</span>
                <div className="h-[1px] bg-[#d1d5db] flex-1"></div>
              </div>

              <button 
                type="button" 
                onClick={() => {
                  if (email) {
                    onLogin(email);
                  } else {
                    onLogin('default@healthmate.ai');
                  }
                }} 
                className="w-full h-[52px] bg-[#e3f2f5] text-[#00687a] font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbe8ec] active:scale-[0.98] transition-all"
              >
                <Fingerprint className="w-5 h-5" />
                Quick Login as Guest
              </button>
            </form>
          </div>
        )}

        {/* Step: SIGN UP (Email Input) */}
        {step === 'signup' && (
          <div className="w-full flex flex-col items-center animate-[fade-in_0.2s_ease-out]">
            <h1 className="text-3xl font-bold text-[#1a1a1a] text-center mb-2 leading-tight">
              Create Account
            </h1>
            <p className="text-[#434654] text-center mb-6">
              Enter your email to verify your identity.
            </p>

            <form className="w-full flex flex-col gap-4" onSubmit={handleSignUp}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#1a1a1a] flex items-center gap-1">
                  <Mail className="w-4 h-4 text-[#6b7280]" /> Email Address
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[48px] px-4 bg-[#f8f9fb] border border-[#d1d5db] rounded-xl text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  placeholder="name@example.com" 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[52px] mt-2 bg-[#003d9b] text-white font-semibold rounded-full flex items-center justify-center hover:bg-[#002f78] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification OTP'}
              </button>
            </form>
          </div>
        )}


        {/* Step: VERIFY OTP */}
        {step === 'verify_otp' && (
          <div className="w-full flex flex-col items-center animate-[fade-in_0.2s_ease-out]">
            <div className="w-full flex items-center mb-4">
              <button onClick={() => { resetState(); setStep('signup'); }} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
            </div>
            
            <h1 className="text-3xl font-bold text-[#1a1a1a] text-center mb-2 leading-tight">
              Enter OTP
            </h1>
            <p className="text-[#434654] text-center mb-4">
              A 6-digit verification code was sent to <span className="font-semibold text-slate-900">{email}</span>.
            </p>
            <div className="w-full mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex flex-col gap-1 text-center">
              <span className="font-bold">Didn't receive the email?</span>
              <span>For local testing, the verification code is saved to <strong>otp_debug.txt</strong> in your project's root folder.</span>
            </div>

            <form className="w-full flex flex-col gap-4" onSubmit={handleVerifyOtp}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#1a1a1a] flex items-center gap-1">
                  <Key className="w-4 h-4 text-[#6b7280]" /> Verification Code
                </label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  className="w-full h-[48px] px-4 text-center bg-[#f8f9fb] border border-[#d1d5db] rounded-xl text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xl font-bold tracking-[0.5em]" 
                  placeholder="000000" 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[52px] mt-2 bg-[#003d9b] text-white font-semibold rounded-full flex items-center justify-center hover:bg-[#002f78] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
              </button>

              <button 
                type="button" 
                onClick={handleSignUp}
                disabled={loading}
                className="w-full text-center text-sm font-semibold text-[#0052cc] hover:underline mt-2"
              >
                Resend Code
              </button>
            </form>
          </div>
        )}

        {/* Step: CREATE PASSWORD */}
        {step === 'create_password' && (
          <div className="w-full flex flex-col items-center animate-[fade-in_0.2s_ease-out]">
            <h1 className="text-3xl font-bold text-[#1a1a1a] text-center mb-2 leading-tight">
              Create Password
            </h1>
            <p className="text-[#434654] text-center mb-6">
              Establish a password to secure your personal health database.
            </p>

            <form className="w-full flex flex-col gap-4" onSubmit={handleCreatePassword}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#1a1a1a] flex items-center gap-1">
                  <Lock className="w-4 h-4 text-[#6b7280]" /> Password
                </label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-[48px] px-4 bg-[#f8f9fb] border border-[#d1d5db] rounded-xl text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tracking-[0.2em]" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-[#1a1a1a] flex items-center gap-1">
                  <Lock className="w-4 h-4 text-[#6b7280]" /> Confirm Password
                </label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-[48px] px-4 bg-[#f8f9fb] border border-[#d1d5db] rounded-xl text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all tracking-[0.2em]" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-[52px] mt-2 bg-[#003d9b] text-white font-semibold rounded-full flex items-center justify-center hover:bg-[#002f78] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account & Login'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
