import { useState, useEffect } from 'react';
import { Footprints, Heart, Moon, Download, Pill, CheckCircle2, Clock, Bluetooth, FileText, X } from 'lucide-react';

import { Medication } from '../types';
import { api } from '../lib/api';
import { t } from '../lib/translations';

interface ReportsProps {
  meds: Medication[];
}

export function Reports({ meds }: ReportsProps) {
  const [logs, setLogs] = useState<{ id: number; timestamp: string; medication_name: string; action: string }[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Smartwatch Bluetooth simulator state
  const [paired, setPaired] = useState(localStorage.getItem('watch_paired') === 'true');
  const [pairing, setPairing] = useState(false);
  const [liveBpm, setLiveBpm] = useState(72);
  const [liveSteps, setLiveSteps] = useState(42850);
  const [stressSimulated, setStressSimulated] = useState(false);
  
  // Vitals history logs to send to ReportAgent
  const [bpmHistory, setBpmHistory] = useState<number[]>([70, 72, 75, 71, 74]);
  const [stepsHistory, setStepsHistory] = useState<number[]>([6200, 7100, 5800, 8400, 6950, 8400, 42850]);

  // Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMd, setReportMd] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Poll smartwatch live vitals (simulated)
  useEffect(() => {
    let interval: any;
    if (paired) {
      interval = setInterval(() => {
        const base = stressSimulated ? 108 : 74;
        const drift = Math.floor(Math.random() * 7) - 3;
        const newBpm = base + drift;
        setLiveBpm(newBpm);
        setBpmHistory(prev => [...prev.slice(-20), newBpm]);

        setLiveSteps(prev => {
          const stepDrift = Math.floor(Math.random() * 4);
          return prev + stepDrift;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [paired, stressSimulated]);


  useEffect(() => {
    api.getLogs()
      .then(res => setLogs(res.logs))
      .catch(() => { /* backend offline, no logs */ })
      .finally(() => setLoadingLogs(false));
  }, []);

  const takenCount = meds.filter(m => m.status === 'taken').length;
  const totalCount = meds.length;
  const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const actionColor = (action: string) => {
    if (action === 'taken') return 'text-secondary bg-secondary/10';
    if (action === 'snoozed') return 'text-amber-600 bg-amber-50';
    if (action === 'triggered') return 'text-primary bg-primary/10';
    if (action === 'missed') return 'text-error bg-error-container/20';
    return 'text-outline bg-surface-container';
  };

  const handleGenerateReport = async (period: "weekly" | "monthly") => {
    setGeneratingReport(true);
    try {
      const res = await api.getSmartwatchReport(period, bpmHistory, [...stepsHistory, liveSteps]);
      setReportMd(res.report_md);
      setShowReportModal(true);
    } catch {
      const fallbackReport = `# HEALTH INSIGHTS REPORT (Offline Fallback)
Generated on: ${new Date().toLocaleDateString('en-IN')}
Adherence: ${adherence}%
Avg Heart Rate: ${paired ? liveBpm : 72} BPM
Total Steps: ${paired ? liveSteps : 42850}

*Disclaimers: Running in Offline Mode. Configure GEMINI_API_KEY to compile advanced report.*`;
      setReportMd(fallbackReport);
      setShowReportModal(true);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (

    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24 h-full overflow-y-auto">

      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">{t('health_insights', 'Health Insights')}</h2>
        <p className="text-sm text-on-surface-variant">{t('vitals_activities', 'Your vitals, activities & medication history.')}</p>
      </div>

      {/* Medication Adherence Card */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{t('adherence', "Today's Adherence")}</p>
            <p className="text-3xl font-bold text-on-surface">{adherence}%</p>
            <p className="text-sm text-on-surface-variant">{takenCount} {t('taken_of_total', 'of')} {totalCount} {t('taken_of_total', 'medicines taken')}</p>
          </div>
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-variant" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${adherence} 100`} strokeLinecap="round" className="text-primary transition-all duration-700" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
              {adherence}%
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-surface-variant rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-700"
            style={{ width: `${adherence}%` }}
          />
        </div>
      </div>

      {/* Time filter */}
      <div className="bg-surface-container rounded-lg p-1 flex shadow-inner border border-surface-variant/50">
        <button className="flex-1 py-2 bg-surface rounded-md shadow-[0_2px_8px_rgba(0,61,155,0.08)] text-sm font-medium text-primary text-center transition-all">{t('weekly', 'Weekly')}</button>
        <button className="flex-1 py-2 text-sm font-medium text-on-surface-variant text-center hover:text-on-surface transition-colors">{t('monthly', 'Monthly')}</button>
      </div>
      {/* Smartwatch Bluetooth Simulator Widget */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,61,155,0.04)] border border-surface-variant/30 flex flex-col gap-4 animate-[slide-up-fade_0.6s_ease-out_forwards]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paired ? 'bg-secondary/15 text-secondary' : 'bg-outline-variant/20 text-outline-variant'}`}>
              <Bluetooth size={18} className={pairing ? "animate-pulse" : ""} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface leading-none">{t('pairing_status', 'Smartwatch Bluetooth Link')}</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {paired ? t('connected_watch', "Connected to Galaxy Watch (BLE)") : pairing ? t('scanning_watch', "Scanning for nearby devices...") : t('disconnected_watch', "Smartwatch Disconnected")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (paired) {
                setPaired(false);
                localStorage.setItem('watch_paired', 'false');
                setStressSimulated(false);
              } else {
                setPairing(true);
                setTimeout(() => {
                  setPairing(false);
                  setPaired(true);
                  localStorage.setItem('watch_paired', 'true');
                }, 1500);
              }
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              paired 
                ? "bg-error-container/20 text-error hover:bg-error-container/40"
                : "bg-primary text-on-primary hover:bg-primary-container shadow-sm"
            }`}
          >
            {paired ? t('disconnect', 'Disconnect') : pairing ? t('searching', 'Searching...') : t('pair_watch', 'Pair Smartwatch')}
          </button>
        </div>

        {paired && (
          <div className="flex flex-col sm:flex-row gap-3 pt-1 border-t border-surface-variant/20">
            <div className="flex-1 flex items-center justify-between bg-surface-container/30 px-3 py-2 rounded-xl border border-outline-variant/10">
              <span className="text-xs text-on-surface-variant font-medium">{t('live_hr', 'Live Heart Rate:')}</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${stressSimulated ? 'text-error animate-pulse' : 'text-tertiary'}`}>
                <Heart size={14} className="fill-current animate-pulse" /> {liveBpm} BPM
              </span>
            </div>
            <div className="flex-1 flex items-center justify-between bg-surface-container/30 px-3 py-2 rounded-xl border border-outline-variant/10">
              <span className="text-xs text-on-surface-variant font-medium">{t('steps_count', 'Steps Count:')}</span>
              <span className="text-sm font-bold text-secondary flex items-center gap-1">
                <Footprints size={14} /> {liveSteps.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStressSimulated(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                stressSimulated 
                  ? "bg-error text-on-error shadow-sm"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/20"
              }`}
            >
              {stressSimulated ? t('reset_vitals', 'Reset Vitals') : t('simulate_stress', 'Simulate Stress BPM')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Steps Chart */}
        <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,61,155,0.04)] border border-surface-variant/30 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1 text-secondary mb-1">
                <Footprints size={20} />
                <span className="text-sm font-medium uppercase tracking-wider">{t('step_count', 'Step Count')}</span>
              </div>
              <div className="text-3xl font-bold text-on-surface">
                {paired ? liveSteps.toLocaleString() : "42,850"}{" "}
                <span className="text-base font-normal text-on-surface-variant">{t('steps_total', 'steps total')}</span>
              </div>

            </div>
            <div className="inline-flex px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">+12% {t('vs_last_week', 'vs last week')}</div>
          </div>

          <div className="h-48 w-full mt-2 relative flex items-end justify-between px-2 pb-6 border-b border-surface-variant border-dashed">
            {[40, 60, 50, 80, 70, 95, 30].map((h, i) => (
              <div key={i} style={{ height: `${h}%` }} className={`w-[10%] ${i === 5 ? 'bg-secondary/80 shadow-[0_0_12px_rgba(0,104,122,0.4)]' : 'bg-primary/20 hover:bg-primary/40'} rounded-t-md transition-colors cursor-pointer relative group`}>
                {i === 5 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-xs font-semibold px-2 py-1 rounded">9.5k</div>}
              </div>
            ))}
            <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs font-semibold text-on-surface-variant translate-y-full pt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <span key={d} className={i === 5 ? 'text-secondary font-bold' : ''}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,61,155,0.04)] border border-surface-variant/30 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-tertiary-container/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 text-tertiary">
            <Heart size={24} />
            <span className="text-sm font-medium uppercase tracking-wide">{t('heart_rate', 'Avg Heart Rate')}</span>
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className={`text-3xl font-bold leading-none ${stressSimulated ? 'text-error animate-pulse' : 'text-on-surface'}`}>
              {paired ? liveBpm : "72"}{" "}
              <span className="text-base font-normal text-on-surface-variant">bpm</span>
            </div>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${stressSimulated ? 'bg-error-container/20 text-error animate-bounce' : 'bg-secondary/10 text-secondary'}`}>
              {stressSimulated ? "Stress Alert" : "Normal"}
            </div>
          </div>

        </div>

        {/* Sleep Quality */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,61,155,0.04)] border border-surface-variant/30 flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary-container/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 text-primary">
            <Moon size={24} />
            <span className="text-sm font-medium uppercase tracking-wide">{t('sleep_quality', 'Sleep Quality')}</span>
          </div>
          <div className="flex items-end justify-between mt-auto">
            <div className="text-3xl font-bold text-on-surface leading-none">85 <span className="text-base font-normal text-on-surface-variant">/100</span></div>
            <div className="inline-flex px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">Restful</div>
          </div>
        </div>
      </div>

      {/* Medication Log Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant/30 overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-surface-variant/30">
          <Pill size={18} className="text-primary" />
          <h3 className="font-bold text-on-surface">{t('medication_log', 'Medication Action Log')}</h3>
          <span className="ml-auto text-xs text-outline bg-surface-container px-2 py-0.5 rounded-full">{logs.length} {t('records', 'records')}</span>
        </div>

        {loadingLogs ? (
          <div className="p-6 text-center text-sm text-on-surface-variant">{t('loading_logs', 'Loading logs...')}</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center">
            <Clock size={32} className="text-outline mx-auto mb-2 opacity-40" />
            <p className="text-sm text-on-surface-variant">{t('no_logs', 'No medication actions yet. Logs appear when alarms trigger.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-variant/20">
            {logs.slice(0, 15).map(log => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 size={16} className="text-outline flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{log.medication_name}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${actionColor(log.action)}`}>
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => handleGenerateReport("weekly")}
        disabled={generatingReport}
        className="w-full h-12 bg-primary text-on-primary rounded-full text-base font-semibold flex justify-center items-center gap-3 shadow-[0_4px_12px_rgba(0,61,155,0.15)] hover:bg-surface-tint active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {generatingReport ? (
          <>
            <Clock size={20} className="animate-spin" />
            {t('generating_report', 'Generating Report...')}
          </>
        ) : (
          <>
            <Download size={20} />
            {t('generate_report', 'Generate & Download Health Report')}
          </>
        )}
      </button>

      {/* Health Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[28px] p-6 max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col gap-4 animate-[slide-up_0.3s_ease-out]">
            <div className="flex justify-between items-center pb-2 border-b border-surface-variant/30">
              <div className="flex items-center gap-2 text-primary">
                <FileText size={22} />
                <h3 className="text-xl font-bold text-on-surface">Health Analytics Report</h3>
              </div>
              <button 
                onClick={() => setShowReportModal(false)} 
                className="p-2 bg-surface-container rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 text-sm text-on-surface-variant whitespace-pre-wrap font-sans leading-relaxed border border-surface-variant/20 rounded-xl p-4 bg-surface-container/10 select-text">
              {reportMd}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`<pre style="font-family: sans-serif; padding: 20px; line-height: 1.5; white-space: pre-wrap;">${reportMd}</pre>`);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                className="flex-1 bg-primary text-on-primary py-3 rounded-full text-sm font-semibold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all"
              >
                {t('print_export', 'Print / Export Report')}
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant py-3 rounded-full text-sm font-semibold transition-all"
              >
                {t('close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
