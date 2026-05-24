/**
 * HealthMate AI - API Service Layer
 * All calls to the FastAPI Python backend (http://localhost:8000)
 */

const BASE_URL = window.location.port === "3000" ? "http://localhost:8000" : window.location.origin;


async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ---- Types ----
export interface ApiMedication {
  id: number;
  name: string;
  time: string;
  dosage: string;
  frequency: string;
  status: string;
  schedule: string;
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  message: string;
  timestamp?: string;
  agent_logs?: string[];
}


export interface ActiveAlarm {
  active: boolean;
  alarm: ApiMedication | null;
  ist_time: string;
}

export interface ChatResponse {
  response: string;
  is_emergency: boolean;
  hospitals: Hospital[];
  agent_logs?: string[];
}

export interface Hospital {
  name: string;
  distance: string;
  phone: string;
  address: string;
}

export interface OcrResult {
  success: boolean;
  raw_text: string;
  extracted_data: {
    name: string;
    dosage: string;
    frequency: string;
    time: string;
  };
  source: string;
  response?: string;
  agent_logs?: string[];
}


// ---- Endpoints ----

export const api = {
  // Server time (IST)
  getTime: () =>
    apiFetch<{ time_24h: string; time_12h: string; date: string; timezone: string }>("/api/time"),

  // Medications
  getMedications: () =>
    apiFetch<{ medications: ApiMedication[]; count: number }>("/api/medications"),

  addMedication: (med: {
    name: string;
    time: string;
    dosage: string;
    frequency: string;
    schedule: string;
  }) =>
    apiFetch<{ success: boolean; message: string }>("/api/medications", {
      method: "POST",
      body: JSON.stringify(med),
    }),

  updateMedStatus: (id: number, status: string) =>
    apiFetch<{ success: boolean }>(`/api/medications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteMedication: (id: number) =>
    apiFetch<{ success: boolean }>(`/api/medications/${id}`, {
      method: "DELETE",
    }),

  // Active Alarm
  getActiveAlarm: () => apiFetch<ActiveAlarm>("/api/alarm/active"),

  takeMedication: () =>
    apiFetch<{ success: boolean; message: string }>("/api/alarm/action", {
      method: "POST",
      body: JSON.stringify({ action: "take" }),
    }),

  snoozeMedication: () =>
    apiFetch<{ success: boolean; message: string }>("/api/alarm/action", {
      method: "POST",
      body: JSON.stringify({ action: "snooze" }),
    }),

  // AI Chat
  sendMessage: (message: string, history: ChatMessage[], language: string = "english") =>
    apiFetch<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, history, language }),
    }),

  // Health Report
  getSmartwatchReport: (period: "weekly" | "monthly", hrHistory: number[], stepsHistory: number[]) =>
    apiFetch<{ success: boolean; period: string; date: string; adherence: number; avg_hr: number; total_steps: number; report_md: string }>("/api/report", {
      method: "POST",
      body: JSON.stringify({ period, heart_rate_history: hrHistory, steps_history: stepsHistory }),
    }),

  // Voice playback controls
  pauseVoice: () =>
    apiFetch<{ success: boolean }>("/api/voice/pause", { method: "POST" }),

  resumeVoice: () =>
    apiFetch<{ success: boolean }>("/api/voice/resume", { method: "POST" }),

  stopVoice: () =>
    apiFetch<{ success: boolean }>("/api/voice/stop", { method: "POST" }),

  getVoiceStatus: () =>
    apiFetch<{ success: boolean; playing: boolean }>("/api/voice/status"),



  getChatHistory: () =>
    apiFetch<{ history: ChatMessage[] }>("/api/chat/history"),

  clearChatHistory: () =>
    apiFetch<{ success: boolean }>("/api/chat/history", { method: "DELETE" }),

  // Emergency
  getEmergencyInfo: () =>
    apiFetch<{ contacts: string[]; maps_link: string; hospitals: Hospital[] }>("/api/emergency"),

  checkEmergency: (text: string) =>
    apiFetch<{ is_emergency: boolean; symptom: string | null; guide: string | null; hospitals: Hospital[] }>(
      "/api/emergency/check",
      { method: "POST", body: JSON.stringify({ message: text }) }
    ),

  // OCR
  scanDemoPrescription: (key: string) =>
    apiFetch<OcrResult>("/api/ocr/demo", {
      method: "POST",
      body: JSON.stringify({ key }),
    }),

  uploadPrescription: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${BASE_URL}/api/ocr/upload`, { method: "POST", body: form }).then(
      (r) => r.json() as Promise<OcrResult>
    );
  },

  // Logs
  getLogs: () =>
    apiFetch<{ logs: { id: number; timestamp: string; medication_name: string; action: string }[] }>(
      "/api/logs"
    ),
};
