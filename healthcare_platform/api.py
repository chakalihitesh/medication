"""
HealthMate AI - FastAPI Backend
Exposes all AI modules as REST endpoints for the React frontend.
Timezone: Asia/Kolkata (IST +05:30)
"""

import os
import sys
import threading
import datetime
import pytz
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import io

# Fix stdout encoding for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ---- Import local modules ----
import database
import emergency
import chatbot
from agents import HealthAgentCoordinator

# Instantiate Global Multi-Agent Orchestrator
coordinator = HealthAgentCoordinator()


# IST timezone object
IST = pytz.timezone("Asia/Kolkata")

# ============================================================
# STARTUP / SHUTDOWN  (reminder thread + DB init)
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    if not os.path.exists(database.DB_PATH):
        database.init_db()
    else:
        database.init_db()

    # Start background reminder scheduler thread (IST-aware)
    start_ist_scheduler()
    print("[API] FastAPI server started. IST scheduler running.")
    yield
    print("[API] FastAPI server shutting down.")


app = FastAPI(title="HealthMate AI API", version="2.0.0", lifespan=lifespan)

# Allow React dev server (port 3000) and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# IST-AWARE ALARM SCHEDULER (background thread)
# ============================================================
_scheduler_lock = threading.Lock()
_scheduler_started = False
_triggered_cache: dict[str, str] = {}
_snoozed_cache: dict[int, str] = {}
_active_alarm: dict | None = None
_alarm_lock = threading.Lock()


def get_ist_time() -> datetime.datetime:
    return datetime.datetime.now(IST)


def get_active_alarm():
    with _alarm_lock:
        return _active_alarm


def set_active_alarm(med):
    global _active_alarm
    with _alarm_lock:
        _active_alarm = med


def play_alarm():
    try:
        from pygame import mixer
        if not mixer.get_init():
            mixer.init()
        alarm_path = os.path.join(os.path.dirname(__file__), "assets", "alarm.wav")
        mixer.music.load(alarm_path)
        mixer.music.play(-1)
        print("[ALARM] Sound started (IST)")
    except Exception as e:
        print(f"[ALARM ERROR] {e}")


def stop_alarm():
    try:
        from pygame import mixer
        if mixer.get_init():
            mixer.music.stop()
    except Exception as e:
        print(f"[ALARM STOP ERROR] {e}")


def push_desktop_notification(name: str, dosage: str):
    try:
        from plyer import notification
        notification.notify(
            title="Medicine Reminder",
            message=f"Time to take {name} ({dosage})!",
            app_name="HealthMate AI",
            timeout=15
        )
    except Exception as e:
        print(f"[NOTIFICATION ERROR] {e}")


def _scheduler_loop():
    global _triggered_cache, _snoozed_cache
    last_reset_day = ""

    while True:
        try:
            now = get_ist_time()
            current_hhmm = now.strftime("%H:%M")
            today_str = now.strftime("%d-%m-%Y")

            # Midnight reset
            if last_reset_day and last_reset_day != today_str:
                database.reset_daily_statuses()
                _triggered_cache.clear()
                _snoozed_cache.clear()
                print(f"[SCHEDULER] Midnight reset done for {today_str} IST")
            last_reset_day = today_str

            meds = database.get_all_medications()
            current_ringing = get_active_alarm()

            for med in meds:
                med_id = med["id"]
                med_time = med["time"]
                med_status = med["status"]

                is_due = (current_hhmm == med_time) and (med_status == "pending")
                is_snoozed_due = (current_hhmm == _snoozed_cache.get(med_id, ""))
                already_fired = (_triggered_cache.get(med_id) == current_hhmm)

                if (is_due or is_snoozed_due) and not already_fired and not current_ringing:
                    _triggered_cache[med_id] = current_hhmm
                    if med_id in _snoozed_cache:
                        del _snoozed_cache[med_id]

                    set_active_alarm(med)
                    database.log_action(med["name"], "triggered")
                    play_alarm()
                    push_desktop_notification(med["name"], med["dosage"])
                    print(f"[ALARM] Triggered: {med['name']} at {current_hhmm} IST")

        except Exception as e:
            print(f"[SCHEDULER ERROR] {e}")

        import time
        time.sleep(5)


def start_ist_scheduler():
    global _scheduler_started
    with _scheduler_lock:
        if not _scheduler_started:
            t = threading.Thread(target=_scheduler_loop, daemon=True)
            t.start()
            _scheduler_started = True
            print("[SCHEDULER] IST-aware background scheduler started.")


# ============================================================
# PYDANTIC MODELS
# ============================================================
class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    language: Optional[str] = "english"


class ReportRequest(BaseModel):
    period: str
    heart_rate_history: list[int] = []
    steps_history: list[int] = []



class MedicationCreate(BaseModel):
    name: str
    time: str        # HH:MM 24h
    dosage: str
    frequency: str
    schedule: str    # morning | afternoon | evening


class MedStatusUpdate(BaseModel):
    status: str      # taken | pending | missed


class AlarmAction(BaseModel):
    action: str      # take | snooze


# ============================================================
# ROUTES
# ============================================================

@app.get("/api/status")
def api_status():
    now = get_ist_time()
    return {
        "service": "HealthMate AI API",
        "version": "2.0.0",
        "ist_time": now.strftime("%H:%M:%S"),
        "ist_date": now.strftime("%d %B %Y"),
        "timezone": "Asia/Kolkata (IST +05:30)",
        "status": "running"
    }



@app.get("/api/time")
def get_server_time():
    now = get_ist_time()
    return {
        "time_24h": now.strftime("%H:%M"),
        "time_12h": now.strftime("%I:%M %p"),
        "date": now.strftime("%A, %d %B %Y"),
        "timezone": "IST (Asia/Kolkata)",
        "utc_offset": "+05:30"
    }


# ---------- MEDICATIONS ----------

@app.get("/api/medications")
def get_medications():
    meds = database.get_all_medications()
    return {"medications": meds, "count": len(meds)}


@app.post("/api/medications")
def create_medication(med: MedicationCreate):
    database.add_medication(med.name, med.time, med.dosage, med.frequency, med.schedule)
    return {"success": True, "message": f"Medication '{med.name}' scheduled at {med.time} IST"}


@app.patch("/api/medications/{med_id}")
def update_med_status(med_id: int, update: MedStatusUpdate):
    database.update_medication_status(med_id, update.status)
    database.log_action(f"med_id:{med_id}", update.status)
    return {"success": True, "status": update.status}


@app.delete("/api/medications/{med_id}")
def delete_medication(med_id: int):
    database.delete_medication(med_id)
    return {"success": True, "message": f"Medication {med_id} deleted"}


# ---------- ACTIVE ALARM ----------

@app.get("/api/alarm/active")
def get_active_alarm_state():
    alarm = get_active_alarm()
    ist_now = get_ist_time()
    return {
        "active": alarm is not None,
        "alarm": alarm,
        "ist_time": ist_now.strftime("%H:%M:%S")
    }


@app.post("/api/alarm/action")
def handle_alarm_action(action: AlarmAction):
    alarm = get_active_alarm()
    if not alarm:
        return {"success": False, "message": "No active alarm"}

    stop_alarm()

    if action.action == "take":
        database.update_medication_status(alarm["id"], "taken")
        database.log_action(alarm["name"], "taken")
        set_active_alarm(None)
        return {"success": True, "message": f"{alarm['name']} marked as taken"}

    elif action.action == "snooze":
        now = get_ist_time()
        snooze_target = now + datetime.timedelta(minutes=5)
        snooze_hhmm = snooze_target.strftime("%H:%M")
        _snoozed_cache[alarm["id"]] = snooze_hhmm
        database.log_action(alarm["name"], "snoozed")
        set_active_alarm(None)
        return {"success": True, "message": f"Snoozed until {snooze_hhmm} IST"}

    return {"success": False, "message": "Unknown action"}


# ---------- AI CHATBOT ----------

@app.post("/api/chat")
def chat_with_ai(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    result = coordinator.process_chat_query(req.message, req.history, req.language)
    return result




@app.get("/api/chat/history")
def get_chat_history():
    history = database.get_chat_history(limit=100)
    return {"history": history}


@app.delete("/api/chat/history")
def clear_history():
    database.clear_chat_history()
    return {"success": True, "message": "Chat history cleared"}


# ---------- EMERGENCY ----------

@app.get("/api/emergency")
def get_emergency_contacts():
    return {
        "contacts": ["911", "112", "102"],
        "maps_link": emergency.get_google_maps_link(),
        "hospitals": emergency.MOCK_HOSPITALS
    }


@app.post("/api/emergency/check")
def check_emergency_text(req: ChatRequest):
    result = emergency.check_emergency(req.message)
    return result


# ---------- OCR PRESCRIPTION ----------

@app.post("/api/ocr/demo")
def scan_demo_prescription(demo: dict):
    """Scan a built-in demo prescription (amoxicillin or metformin)."""
    demo_key = demo.get("key", "demo_amoxicillin.png")
    result = coordinator.process_prescription_scan(None, demo_key=demo_key)
    return result


@app.post("/api/ocr/upload")
async def upload_prescription(file: UploadFile = File(...)):
    """Upload a prescription image for OCR scanning."""
    contents = await file.read()
    image_file = io.BytesIO(contents)
    image_file.name = file.filename
    result = coordinator.process_prescription_scan(image_file)
    return result



# ---------- LOGS ----------

@app.get("/api/logs")
def get_logs():
    logs = database.get_logs(limit=100)
    return {"logs": logs}


# ---------- REPORT ----------

@app.post("/api/report")
def generate_report(req: ReportRequest):
    # Log the average vitals to database if provided
    if req.heart_rate_history and req.steps_history:
        avg_hr = sum(req.heart_rate_history) // len(req.heart_rate_history)
        latest_steps = req.steps_history[-1]
        database.log_vitals(avg_hr, latest_steps)
        
    result = coordinator.generate_health_report(req.period, req.heart_rate_history, req.steps_history)
    return result


# ---------- VOICE CONTROLS ----------

@app.post("/api/voice/pause")
def pause_voice_playback():
    try:
        from pygame import mixer
        if mixer.get_init():
            mixer.music.pause()
            print("[VOICE] Paused speech playback")
            return {"success": True, "status": "paused"}
    except Exception as e:
        print(f"[VOICE CONTROL ERROR] {e}")
    return {"success": False, "message": "Failed to pause voice"}


@app.post("/api/voice/resume")
def resume_voice_playback():
    try:
        from pygame import mixer
        if mixer.get_init():
            mixer.music.unpause()
            print("[VOICE] Resumed speech playback")
            return {"success": True, "status": "playing"}
    except Exception as e:
        print(f"[VOICE CONTROL ERROR] {e}")
    return {"success": False, "message": "Failed to resume voice"}


@app.post("/api/voice/stop")
def stop_voice_playback():
    try:
        from pygame import mixer
        if mixer.get_init():
            mixer.music.stop()
            print("[VOICE] Stopped speech playback")
            return {"success": True, "status": "stopped"}
    except Exception as e:
        print(f"[VOICE CONTROL ERROR] {e}")
    return {"success": False, "message": "Failed to stop voice"}


@app.get("/api/voice/status")
def get_voice_status():
    try:
        from pygame import mixer
        if mixer.get_init():
            is_busy = mixer.music.get_busy()
            return {"success": True, "playing": is_busy}
    except: pass
    return {"success": True, "playing": False}


# ---------- STATIC FILES & SPA FALLBACK ----------

dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "medication-main", "dist"))

if os.path.exists(dist_dir):
    print(f"[API] Mounting static files from: {dist_dir}")
    # Mount assets folder for bundle assets
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html for SPA fallback and static files from the dist root
    @app.get("/{catchall:path}")
    async def serve_react_app(catchall: str):
        # Exclude API and Docs endpoints
        if (
            catchall.startswith("api")
            or catchall.startswith("docs")
            or catchall.startswith("redoc")
            or catchall.startswith("openapi.json")
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        # Serve static file from dist folder if it exists
        file_path = os.path.join(dist_dir, catchall)
        if catchall and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        # Fallback to serving index.html for SPA routing
        index_path = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="React build index.html not found")
else:
    print(f"[WARNING] Static dist folder not found at: {dist_dir}. React app won't be served.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)

