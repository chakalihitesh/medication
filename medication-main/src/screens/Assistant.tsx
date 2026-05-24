import { useState, useEffect, useRef } from 'react';
import { Bot, Send, AlertTriangle, Info, Trash2, Loader2, PhoneCall, Volume2, Pause, Play, Square } from 'lucide-react';
import { api, ChatMessage, Hospital } from '../lib/api';
import { cn } from '../lib/utils';
import { t } from '../lib/translations';

export function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emergencyInfo, setEmergencyInfo] = useState<{ hospitals: Hospital[]; maps_link: string } | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voicePaused, setVoicePaused] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history and emergency info on mount
  useEffect(() => {
    loadHistory();
    loadEmergencyInfo();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll voice status
  useEffect(() => {
    const pollStatus = async () => {
      if (!backendOnline) return;
      try {
        const status = await api.getVoiceStatus();
        if (status.playing) {
          setVoicePlaying(true);
          setVoicePaused(false);
        } else {
          if (!voicePaused) {
            setVoicePlaying(false);
          }
        }
      } catch {
        setVoicePlaying(false);
        setVoicePaused(false);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 1500);
    return () => clearInterval(interval);
  }, [backendOnline, voicePaused]);

  const loadHistory = async () => {
    try {
      const res = await api.getChatHistory();
      if (res.history.length > 0) {
        setMessages(res.history);
      } else {
        // Default welcome message
        setMessages([{
          role: 'assistant',
          message: t('welcome_message', "Hello! I'm HealthMate AI — your intelligent health companion. Ask me about symptoms, medications, diet, or general wellness. In an emergency, press the SOS button immediately.")
        }]);
      }
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
      setMessages([{
        role: 'assistant',
        message: t('welcome_offline_message', "Hello! I'm HealthMate AI. The AI backend is currently offline. Please start the FastAPI server to enable full AI capabilities.")
      }]);
    }
  };

  const loadEmergencyInfo = async () => {
    try {
      const res = await api.getEmergencyInfo();
      setEmergencyInfo({ hospitals: res.hospitals, maps_link: res.maps_link });
    } catch { /* silent fail */ }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const preferredLanguage = localStorage.getItem('preferred_language') || 'english';
      const res = await api.sendMessage(text, messages.slice(-10), preferredLanguage);
      const botMsg: ChatMessage = { 
        role: 'assistant', 
        message: res.response,
        agent_logs: res.agent_logs
      };
      setMessages(prev => [...prev, botMsg]);

      if (res.is_emergency) {
        // Vibrate on mobile if supported
        if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: t('connection_error_message', "Sorry, I'm having trouble connecting to the AI backend. Please ensure the backend server is running.")
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try {
      await api.clearChatHistory();
    } catch { /* silent */ }
    setMessages([{
      role: 'assistant',
      message: t('chat_cleared', "Chat cleared. How can I help you today?")
    }]);
  };

  const handleSOS = () => {
    if (emergencyInfo?.maps_link) {
      window.open(emergencyInfo.maps_link, '_blank');
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('EMERGENCY SOS', { body: 'Call 102 / 112 immediately!' });
    }
  };

  const handlePauseResume = async () => {
    try {
      if (voicePaused) {
        await api.resumeVoice();
        setVoicePaused(false);
        setVoicePlaying(true);
      } else {
        await api.pauseVoice();
        setVoicePaused(true);
        setVoicePlaying(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopVoice = async () => {
    try {
      await api.stopVoice();
      setVoicePlaying(false);
      setVoicePaused(false);
    } catch (e) {
      console.error(e);
    }
  };

  const formatMessage = (text: string) => {
    // Convert **bold** to strong, preserve line breaks
    return text
      .replace(/\*\/(.*?)\*\//g, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-130px)] relative bg-surface">

      {/* Voice Control Bar */}
      {(voicePlaying || voicePaused) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-surface-container-lowest/95 backdrop-blur border border-outline-variant/40 px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3 animate-[slide-up-fade_0.3s_ease-out_forwards] border-primary/20">
          <div className="flex items-center gap-2 pr-3 border-r border-surface-variant/80">
            <Volume2 size={16} className={cn("text-secondary", voicePlaying && "animate-pulse")} />
            <span className="text-xs font-semibold text-on-surface select-none">
              {voicePlaying ? t('playing_speech', 'Speaking') : t('paused_speech', 'Speech Paused')}
            </span>
          </div>
          <button
            onClick={handlePauseResume}
            className="p-1.5 hover:bg-surface-container rounded-full text-on-surface transition-colors active:scale-90"
            title={voicePaused ? t('continue_speech', 'Continue') : t('pause_speech', 'Pause')}
          >
            {voicePaused ? <Play size={16} className="fill-current text-primary" /> : <Pause size={16} className="fill-current text-primary" />}
          </button>
          <button
            onClick={handleStopVoice}
            className="p-1.5 hover:bg-surface-container text-error rounded-full transition-colors active:scale-90"
            title={t('stop_speech', 'Stop')}
          >
            <Square size={12} className="fill-current text-error" />
          </button>
        </div>
      )}

      {/* Backend Status Banner */}
      {!backendOnline && (
        <div className="mx-0 mb-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium flex items-center gap-2">
          <AlertTriangle size={14} />
          {t('offline_warning', 'AI backend offline — check connection to the backend server')}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto pb-4 flex flex-col gap-4 hide-scrollbar">

        {/* Date pill */}
        <div className="flex justify-center">
          <span className="bg-surface-container text-on-surface-variant text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col gap-1 w-full", msg.role === 'user' ? "items-end" : "items-start")}>
            <div
              className={cn(
                "flex items-end gap-2 max-w-[88%]",
                msg.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot size={18} className="text-on-secondary" />
                </div>
              )}
              <div
                className={cn(
                  "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user'
                    ? "bg-primary text-on-primary rounded-tr-[4px]"
                    : "bg-secondary-container text-on-secondary-container rounded-tl-[4px]"
                )}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}
              />
            </div>
            {msg.role === 'assistant' && msg.agent_logs && msg.agent_logs.length > 0 && (
              <div className="mt-1 ml-10 flex flex-col gap-1">
                <details className="group">
                  <summary className="text-[10px] text-on-surface-variant/75 cursor-pointer list-none flex items-center gap-1 select-none hover:text-primary transition-all">
                    <span className="inline-block transition-transform duration-100 group-open:rotate-90">▶</span>
                    <span>{t('pipeline_logs', 'Cooperative Agent Pipeline logs')} ({msg.agent_logs.length})</span>
                  </summary>
                  <div className="mt-1 pl-3 border-l-2 border-primary/20 flex flex-col gap-1 text-[11px] font-mono text-on-surface-variant/90 max-w-md bg-surface-container/30 py-1.5 px-2.5 rounded-lg border border-outline-variant/10 shadow-sm">
                    {msg.agent_logs.map((log, idx) => (
                      <div key={idx} className="leading-tight flex items-start gap-1">
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex items-end gap-2 self-start">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot size={18} className="text-on-secondary" />
            </div>
            <div className="bg-secondary-container p-3.5 rounded-2xl rounded-tl-[4px] flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-secondary" />
              <span className="text-xs text-on-secondary-container">{t('analyzing', 'Analyzing...')}</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {[
            "What are Metformin side effects?",
            "Signs of high blood pressure?",
            "Best diet for diabetes",
            "How to manage stress?"
          ].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); inputRef.current?.focus(); }}
              className="flex-shrink-0 text-xs bg-surface-container text-on-surface-variant px-3 py-2 rounded-full border border-outline-variant/40 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-surface-container-lowest pt-3 pb-2 rounded-t-2xl border-t border-surface-variant">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleSOS}
            className="bg-error text-on-error h-11 px-4 rounded-full flex items-center gap-1.5 shadow-lg hover:bg-[#a01616] active:scale-95 transition-all duration-200 flex-shrink-0"
          >
            <PhoneCall size={16} />
            <span className="text-xs font-bold">SOS</span>
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={t('message_placeholder', 'Message HealthMate AI...')}
              disabled={loading}
              className="w-full h-11 bg-surface rounded-full pl-4 pr-12 border border-surface-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface placeholder:text-outline transition-all disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-40 active:scale-90"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>

          <button
            onClick={clearHistory}
            className="w-11 h-11 flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 rounded-full transition-colors flex-shrink-0"
            title={t('clear_chat', 'Clear chat')}
          >
            <Trash2 size={18} />
          </button>
        </div>

        <p className="text-[10px] font-medium text-on-surface-variant flex items-center justify-center gap-1 tracking-wide opacity-70">
          <Info size={10} />
          {t('assistant_notice', 'AI assistant only — not a licensed medical doctor. Call 102 in emergencies.')}
        </p>
      </div>
    </div>
  );
}
