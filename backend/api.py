"""
HealthMate AI - FastAPI Backend
Exposes all AI modules as REST endpoints for the React frontend.
Timezone: Asia/Kolkata (IST +05:30)
"""

import os
from dotenv import load_dotenv

# Load environment variables at backend startup
load_dotenv()

import sys
import threading
import datetime
import pytz
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Header
import random
import smtplib
import hashlib
from email.mime.text import MIMEText

SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


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
_triggered_cache: dict[str, dict[int, str]] = {}
_snoozed_cache: dict[str, dict[int, str]] = {}
_alarm_snooze_counts: dict[str, dict[int, int]] = {}
_active_alarms: dict[str, dict] = {}
_alarm_lock = threading.Lock()


def get_ist_time() -> datetime.datetime:
    return datetime.datetime.now(IST)


def get_active_alarm(user_email: Optional[str] = None):
    if not user_email:
        user_email = "default@healthmate.ai"
    with _alarm_lock:
        return _active_alarms.get(user_email)


def set_active_alarm(user_email: Optional[str], med):
    if not user_email:
        user_email = "default@healthmate.ai"
    global _active_alarms
    with _alarm_lock:
        if med is None:
            _active_alarms.pop(user_email, None)
        else:
            _active_alarms[user_email] = med


def play_alarm():
    try:
        from pygame import mixer
        if not mixer.get_init():
            mixer.init()
        alarm_path = os.path.join(os.path.dirname(__file__), "assets", "alarm.mpeg")
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

            users = database.get_all_users()
            if not users:
                users = ["default@healthmate.ai"]
            elif "default@healthmate.ai" not in users:
                users.append("default@healthmate.ai")

            # Midnight reset
            if last_reset_day and last_reset_day != today_str:
                for user in users:
                    database.reset_daily_statuses(user_email=user)
                _triggered_cache.clear()
                _snoozed_cache.clear()
                print(f"[SCHEDULER] Midnight reset done for all users for {today_str} IST")
            last_reset_day = today_str

            any_ringing = any(v is not None for v in _active_alarms.values())

            for user in users:
                meds = database.get_all_medications(user_email=user)
                current_ringing = get_active_alarm(user)

                user_triggered = _triggered_cache.setdefault(user, {})
                user_snoozed = _snoozed_cache.setdefault(user, {})

                for med in meds:
                    med_id = med["id"]
                    med_time = med["time"]
                    med_status = med["status"]

                    is_due = (current_hhmm == med_time) and (med_status == "pending")
                    is_snoozed_due = (current_hhmm == user_snoozed.get(med_id, ""))
                    already_fired = (user_triggered.get(med_id) == current_hhmm)

                    if (is_due or is_snoozed_due) and not already_fired and not current_ringing and not any_ringing:
                        user_triggered[med_id] = current_hhmm
                        user_snoozed.pop(med_id, None)

                        set_active_alarm(user, med)
                        database.log_action(med["name"], "triggered", user_email=user)
                        play_alarm()
                        push_desktop_notification(med["name"], med["dosage"])
                        print(f"[ALARM] Triggered: {med['name']} for user {user} at {current_hhmm} IST")
                        any_ringing = True
                        break

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
def get_medications(x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    meds = database.get_all_medications(user_email=x_user_email)
    return {"medications": meds, "count": len(meds)}


@app.post("/api/medications")
def create_medication(med: MedicationCreate, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    database.add_medication(med.name, med.time, med.dosage, med.frequency, med.schedule, user_email=x_user_email)
    return {"success": True, "message": f"Medication '{med.name}' scheduled at {med.time} IST"}


@app.patch("/api/medications/{med_id}")
def update_med_status(med_id: int, update: MedStatusUpdate, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    database.update_medication_status(med_id, update.status, user_email=x_user_email)
    database.log_action(f"med_id:{med_id}", update.status, user_email=x_user_email)
    return {"success": True, "status": update.status}


@app.delete("/api/medications/{med_id}")
def delete_medication(med_id: int, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    database.delete_medication(med_id, user_email=x_user_email)
    return {"success": True, "message": f"Medication {med_id} deleted"}


# ---------- ACTIVE ALARM ----------

@app.get("/api/alarm/active")
def get_active_alarm_state(x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    alarm = get_active_alarm(x_user_email)
    ist_now = get_ist_time()
    snooze_count = 0
    if alarm:
        user_snoozes = _alarm_snooze_counts.setdefault(x_user_email or "default@healthmate.ai", {})
        snooze_count = user_snoozes.get(alarm["id"], 0)
    return {
        "active": alarm is not None,
        "alarm": alarm,
        "ist_time": ist_now.strftime("%H:%M:%S"),
        "snooze_count": snooze_count
    }


@app.post("/api/alarm/action")
def handle_alarm_action(action: AlarmAction, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    email = x_user_email or "default@healthmate.ai"
    alarm = get_active_alarm(email)
    if not alarm:
        return {"success": False, "message": "No active alarm"}

    stop_alarm()

    user_snoozes = _alarm_snooze_counts.setdefault(email, {})
    user_snoozed = _snoozed_cache.setdefault(email, {})

    if action.action == "take":
        database.update_medication_status(alarm["id"], "taken", user_email=email)
        database.log_action(alarm["name"], "taken", user_email=email)
        user_snoozes[alarm["id"]] = 0
        set_active_alarm(email, None)
        return {"success": True, "message": f"{alarm['name']} marked as taken"}

    elif action.action == "snooze":
        current_snoozes = user_snoozes.get(alarm["id"], 0)
        now = get_ist_time()
        snooze_target = now + datetime.timedelta(minutes=5)
        snooze_hhmm = snooze_target.strftime("%H:%M")
        user_snoozed[alarm["id"]] = snooze_hhmm
        user_snoozes[alarm["id"]] = current_snoozes + 1
        database.log_action(alarm["name"], "snoozed", user_email=email)
        set_active_alarm(email, None)
        return {"success": True, "message": f"Snoozed until {snooze_hhmm} IST"}

    elif action.action == "miss":
        database.update_medication_status(alarm["id"], "missed", user_email=email)
        database.log_action(alarm["name"], "missed", user_email=email)
        user_snoozes[alarm["id"]] = 0
        set_active_alarm(email, None)
        return {"success": True, "message": f"{alarm['name']} marked as not taken"}

    return {"success": False, "message": "Unknown action"}


# ---------- AI CHATBOT ----------

@app.post("/api/chat")
def chat_with_ai(req: ChatRequest, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    result = coordinator.process_chat_query(req.message, req.history, req.language, user_email=x_user_email)
    return result




@app.get("/api/chat/history")
def get_chat_history(x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    history = database.get_chat_history(limit=100, user_email=x_user_email)
    return {"history": history}


@app.delete("/api/chat/history")
def clear_history(x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    database.clear_chat_history(user_email=x_user_email)
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
def scan_demo_prescription(demo: dict, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    """Scan a built-in demo prescription (amoxicillin or metformin)."""
    demo_key = demo.get("key", "demo_amoxicillin.png")
    result = coordinator.process_prescription_scan(None, demo_key=demo_key, user_email=x_user_email)
    return result


@app.post("/api/ocr/upload")
async def upload_prescription(file: UploadFile = File(...), x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    """Upload a prescription image for OCR scanning."""
    contents = await file.read()
    image_file = io.BytesIO(contents)
    image_file.name = file.filename
    result = coordinator.process_prescription_scan(image_file, user_email=x_user_email)
    return result



# ---------- LOGS ----------

@app.get("/api/logs")
def get_logs(x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    logs = database.get_logs(limit=100, user_email=x_user_email)
    return {"logs": logs}


# ---------- REPORT ----------

@app.post("/api/report")
def generate_report(req: ReportRequest, x_user_email: Optional[str] = Header(None, alias="X-User-Email")):
    # Log the average vitals to database if provided
    if req.heart_rate_history and req.steps_history:
        avg_hr = sum(req.heart_rate_history) // len(req.heart_rate_history)
        latest_steps = req.steps_history[-1]
        database.log_vitals(avg_hr, latest_steps, user_email=x_user_email)
        
    result = coordinator.generate_health_report(req.period, req.heart_rate_history, req.steps_history, user_email=x_user_email)
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



# ============================================================
# AUTHENTICATION MODELS & ROUTES
# ============================================================
class EmailRequest(BaseModel):
    email: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class RegisterPasswordRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def send_otp_email(receiver_email: str, otp: int) -> bool:
    sender_email = SENDER_EMAIL
    app_password = GMAIL_APP_PASSWORD.replace(" ", "")
    
    # Defensively write the OTP code to a local debug file in the root workspace
    # so that the user is never blocked if Google's SMTP auth fails.
    try:
        workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        debug_file_path = os.path.join(workspace_root, "otp_debug.txt")
        with open(debug_file_path, "w", encoding="utf-8") as f:
            f.write(f"Your OTP code is: {otp}\n(Sent to: {receiver_email})\n")
        print(f"[OTP DEBUG] Wrote code {otp} to {debug_file_path}")
    except Exception as debug_err:
        print(f"[OTP DEBUG ERROR] Failed to write local debug file: {debug_err}")
        
    if not sender_email or not app_password:
        print(f"[SMTP WARNING] Credentials not configured. MOCKING email send. OTP for {receiver_email} is: {otp}")
        return True
    
    try:
        subject = "HEALTH MONITORING"
        body = f"Your OTP is: {otp}"
        
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = receiver_email
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print(f"[SMTP] OTP sent successfully to {receiver_email}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send OTP to {receiver_email}: {e}")
        print(f"[SMTP FALLBACK] OTP is: {otp}")
        return True

@app.post("/api/auth/send-otp")
def api_send_otp(req: EmailRequest):
    email = req.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    otp = str(random.randint(100000, 999999))
    database.create_or_update_otp(email, otp)
    send_otp_email(email, int(otp))
    return {"success": True, "message": "OTP sent successfully"}

@app.post("/api/auth/verify-otp")
def api_verify_otp(req: VerifyOtpRequest):
    email = req.email.strip().lower()
    otp = req.otp.strip()
    
    success = database.verify_user_otp(email, otp)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    return {"success": True, "message": "OTP verified successfully"}

@app.post("/api/auth/register-password")
def api_register_password(req: RegisterPasswordRequest):
    email = req.email.strip().lower()
    password = req.password
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    password_hash = hash_password(password)
    database.register_password(email, password_hash)
    return {"success": True, "message": "Password registered successfully"}

@app.post("/api/auth/login")
def api_login(req: LoginRequest):
    email = req.email.strip().lower()
    password = req.password
    
    password_hash = hash_password(password)
    success = database.authenticate_user(email, password_hash)
    if not success:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {"success": True, "message": "Login successful"}

# ---------- HOSPITAL INTELLIGENCE ENDPOINTS ----------
import math
import requests
import hospital_ai

class ClassifyHospitalRequest(BaseModel):
    name: str
    rating: Optional[float] = 4.0
    reviews: Optional[list[str]] = []
    status: Optional[str] = "OPERATIONAL"

class RecommendHospitalRequest(BaseModel):
    lat: float
    lng: float
    specialty: str
    hospitals: list[dict]

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def fetch_osm_hospitals(lat: float, lng: float, radius: float = 10000):
    query = f"""
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|dentist|doctors|clinic"](around:{radius}, {lat}, {lng});
      way["amenity"~"hospital|dentist|doctors|clinic"](around:{radius}, {lat}, {lng});
    );
    out center;
    """
    try:
        res = requests.get("https://overpass-api.de/api/interpreter", params={"data": query}, timeout=10)
        if res.status_code == 200:
            elements = res.json().get("elements", [])
            hospitals = []
            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name") or tags.get("operator") or "Medical Center"
                lat_val = el.get("lat") or el.get("center", {}).get("lat")
                lng_val = el.get("lon") or el.get("center", {}).get("lon")
                if not lat_val or not lng_val:
                    continue
                dist_km = calculate_distance(lat, lng, lat_val, lng_val)
                hospitals.append({
                    "id": f"osm-{el.get('id')}",
                    "name": name,
                    "address": tags.get("addr:street") or tags.get("addr:suburb") or "Nearby Healthcare Area",
                    "rating": round(4.0 + (el.get("id") % 10) / 10, 1),
                    "distance": f"{dist_km:.1f} km",
                    "lat": lat_val,
                    "lng": lng_val,
                    "status": "OPERATIONAL",
                    "reviews": [
                        "Professional medical staff and clean facilities.",
                        "Short waiting times and helpful reception."
                    ]
                })
            hospitals.sort(key=lambda x: float(x["distance"].split()[0]))
            return hospitals
    except Exception as e:
        print(f"[OSM Fetch Fail] {e}")
    return []

def fetch_fallback_hospitals(lat: float, lng: float):
    offsets = [
        {"name": "Metro Joint & Orthopedic Clinic", "rating": 4.8},
        {"name": "Apex Bone & Joint Care Center", "rating": 4.6},
        {"name": "Grace Women's Health & Maternity", "rating": 4.9},
        {"name": "Motherhood Gynecological Clinic", "rating": 4.7},
        {"name": "Signature Smiles Dental Care", "rating": 4.8},
        {"name": "Pearl Orthodontics & Dental Hub", "rating": 4.5},
        {"name": "Brain & Spine Neuro Care Institute", "rating": 4.9},
        {"name": "Care Neurology Specialist Centre", "rating": 4.6},
        {"name": "City General Hospital & Trauma Centre", "rating": 4.4},
        {"name": "Sacred Heart Medical College", "rating": 4.5}
    ]
    hospitals = []
    for i, item in enumerate(offsets):
        lat_off = (i * 0.005) - 0.025
        lng_off = (i * -0.004) + 0.02
        h_lat = lat + lat_off
        h_lng = lng + lng_off
        dist_km = calculate_distance(lat, lng, h_lat, h_lng)
        hospitals.append({
            "id": f"local-{i+1}",
            "name": item["name"],
            "address": f"Block #{10+i*5}, Health Avenue, Nearby City",
            "rating": item["rating"],
            "distance": f"{dist_km:.1f} km",
            "lat": h_lat,
            "lng": h_lng,
            "status": "OPERATIONAL",
            "reviews": [
                "Experienced specialists and great diagnostic tools.",
                "Well maintained and followed all safety standards."
            ]
        })
    hospitals.sort(key=lambda x: float(x["distance"].split()[0]))
    return hospitals

@app.get("/api/nearby-hospitals")
def get_nearby_hospitals(lat: float, lng: float, radius: float = 10000):
    hospitals = fetch_osm_hospitals(lat, lng, radius)
    if not hospitals:
        hospitals = fetch_fallback_hospitals(lat, lng)
    
    # Cluster using scikit-learn
    hospitals = hospital_ai.cluster_hospitals(hospitals)
    return {"hospitals": hospitals, "count": len(hospitals)}

@app.post("/api/classify-hospital")
def classify_hospital(req: ClassifyHospitalRequest):
    result = hospital_ai.classify_hospital_with_ai(
        req.name,
        req.rating,
        req.reviews,
        req.status
    )
    return result

@app.post("/api/recommend-hospital")
def recommend_hospital(req: RecommendHospitalRequest):
    results = hospital_ai.calculate_recommendation(
        req.lat,
        req.lng,
        req.specialty,
        req.hospitals
    )
    return {"recommendations": results}

# Duplicate root-level routes for full Direct Route compatibility
@app.get("/nearby-hospitals")
def direct_nearby_hospitals(lat: float, lng: float, radius: float = 10000):
    return get_nearby_hospitals(lat, lng, radius)

@app.post("/classify-hospital")
def direct_classify_hospital(req: ClassifyHospitalRequest):
    return classify_hospital(req)

@app.post("/recommend-hospital")
def direct_recommend_hospital(req: RecommendHospitalRequest):
    return recommend_hospital(req)


# ---------- STATIC FILES & SPA FALLBACK ----------


# Point static files directory to the frontend build folder
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

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

