import threading
import time
import schedule
import datetime
from pygame import mixer
from plyer import notification
import database

# Initialize pygame mixer
try:
    mixer.init()
except Exception as e:
    print(f"[AUDIO WARNING] Pygame mixer init failed (no sound card/headless?): {e}")

ALARM_SOUND_PATH = "assets/alarm.mpeg"

# Global state to keep track of the currently ringing medication
# Thread-safe read/write using a lock
_alarm_lock = threading.Lock()
active_alarm = None  # Holds the dict of the currently ringing medication or None

# Thread trackers
_scheduler_started = False
_scheduler_lock = threading.Lock()

# Trackers to avoid duplicate rings in the same minute
# Maps med_id -> HH:MM time string
_triggered_cache = {}

# Cache for snooze timers
# Maps med_id -> HH:MM time string when it should trigger again
_snoozed_cache = {}
_alarm_snooze_counts = {}

def get_active_alarm():
    """Returns the currently active ringing medication alarm (thread-safe)."""
    global active_alarm
    with _alarm_lock:
        return active_alarm

def set_active_alarm(med_dict):
    """Sets the currently active ringing medication alarm (thread-safe)."""
    global active_alarm
    with _alarm_lock:
        active_alarm = med_dict

def play_alarm_sound():
    """Starts playing the alarm beep audio on a loop using pygame."""
    try:
        if mixer.get_init():
            mixer.music.load(ALARM_SOUND_PATH)
            mixer.music.play(-1)  # -1 loops indefinitely
            print("[ALARM SOUND] Sound playback started.")
    except Exception as e:
        print(f"[ALARM SOUND ERROR] Sound playback failed: {e}")

def stop_alarm_sound():
    """Stops the pygame alarm audio."""
    try:
        if mixer.get_init():
            mixer.music.stop()
            print("[ALARM SOUND] Sound playback stopped.")
    except Exception as e:
        print(f"[ALARM SOUND ERROR] Could not stop sound: {e}")

def trigger_med_alarm(med):
    """Triggers the alarm sequence for a medication: audio, notification, and DB log."""
    set_active_alarm(med)
    print(f"[ALARM TRIGGERED] {med['name']} at {med['time']}")
    
    # 1. Start alarm sound
    play_alarm_sound()
    
    # 2. Push desktop notification
    try:
        notification.notify(
            title="💊 Medication Reminder",
            message=f"It's time to take your {med['name']} ({med['dosage']})!",
            app_name="AI Healthcare Assistant",
            timeout=15
        )
    except Exception as e:
        print(f"[NOTIFICATION ERROR] Desktop notification failed: {e}")
        
    # 3. Log the trigger event in the SQLite database
    database.log_action(med["name"], "triggered")

def take_medication(med_id, name):
    """Marks medication as taken, silences sound, logs status in DB, and clears active alarm."""
    stop_alarm_sound()
    
    # Update status to 'taken'
    database.update_medication_status(med_id, "taken")
    # Log event
    database.log_action(name, "taken")
    # Reset snooze count
    global _alarm_snooze_counts
    _alarm_snooze_counts[med_id] = 0
    # Clear active alarm
    set_active_alarm(None)
    print(f"[REMINDER] {name} successfully marked as TAKEN.")

def snooze_medication(med_id, name):
    """Snoozes the alarm for 5 minutes, silences sound, and registers snooze time."""
    stop_alarm_sound()
    
    # Calculate snooze target time (5 minutes from now)
    now = datetime.datetime.now()
    snooze_time = now + datetime.timedelta(minutes=5)
    snooze_hour_min = snooze_time.strftime("%H:%M")
    
    global _snoozed_cache, _alarm_snooze_counts
    _snoozed_cache[med_id] = snooze_hour_min
    _alarm_snooze_counts[med_id] = _alarm_snooze_counts.get(med_id, 0) + 1
    
    # Log event
    database.log_action(name, "snoozed")
    # Clear active alarm
    set_active_alarm(None)
    print(f"[REMINDER] {name} alarm SNOOZED until {snooze_hour_min}")

def miss_medication(med_id, name):
    """Marks medication as missed/not taken, silences sound, logs status in DB, and clears active alarm."""
    stop_alarm_sound()
    database.update_medication_status(med_id, "missed")
    database.log_action(name, "missed")
    global _alarm_snooze_counts
    _alarm_snooze_counts[med_id] = 0
    set_active_alarm(None)
    print(f"[REMINDER] {name} successfully marked as MISSED/NOT TAKEN.")

def _check_schedule_loop():
    """Periodic background routine comparing scheduled medication times to the current time."""
    global _triggered_cache, _snoozed_cache
    
    while True:
        try:
            now = datetime.datetime.now()
            current_time_str = now.strftime("%H:%M")
            current_day_str = now.strftime("%d-%m-%Y")
            
            # Midnight Reset logic (clears taken status for the new day)
            # Checks last reset date stored in a text file or database config
            last_reset = getattr(_check_schedule_loop, "last_reset_day", "")
            if last_reset and last_reset != current_day_str:
                database.reset_daily_statuses()
                _triggered_cache.clear()
                _snoozed_cache.clear()
            _check_schedule_loop.last_reset_day = current_day_str
            
            # Fetch fresh list from database
            meds = database.get_all_medications()
            current_ringing = get_active_alarm()
            
            for med in meds:
                med_id = med["id"]
                med_time = med["time"]  # Format "HH:MM"
                med_name = med["name"]
                med_status = med["status"]
                
                # Check 1: Normal daily schedule trigger
                is_schedule_due = (current_time_str == med_time) and (med_status == 'pending')
                
                # Check 2: Snoozed alarm trigger
                is_snooze_due = (current_time_str == _snoozed_cache.get(med_id, ""))
                
                # Check 3: Check cache to ensure we don't double trigger in the same 60 seconds
                already_triggered_this_minute = (_triggered_cache.get(med_id) == current_time_str)
                
                if (is_schedule_due or is_snooze_due) and not already_triggered_this_minute and not current_ringing:
                    # Cache the trigger to prevent duplicate checks in this minute
                    _triggered_cache[med_id] = current_time_str
                    
                    # Clear snooze cache since it is now firing
                    if med_id in _snoozed_cache:
                        del _snoozed_cache[med_id]
                        
                    # Trigger alarm sequence
                    trigger_med_alarm(med)
                    
        except Exception as e:
            print(f"[SCHEDULER CRITICAL] Error in background schedule loop: {e}")
            
        time.sleep(5)  # Tick every 5 seconds to reduce CPU overhead

def start_reminder_scheduler():
    """Starts the background scheduler daemon thread exactly once (thread-safe)."""
    global _scheduler_started
    with _scheduler_lock:
        if not _scheduler_started:
            t = threading.Thread(target=_check_schedule_loop, daemon=True)
            t.start()
            _scheduler_started = True
            print("[SCHEDULER] Background medication scheduler active.")
        else:
            print("[SCHEDULER] Background scheduler already running.")
