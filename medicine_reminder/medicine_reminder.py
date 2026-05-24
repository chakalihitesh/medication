from plyer import notification
from pygame import mixer
import schedule
import time
import sys
import threading

# Initialize pygame mixer
try:
    mixer.init()
except Exception as e:
    print(f"Warning: Could not initialize pygame mixer (no audio device?): {e}")

alarm_file = "assets/alarm.wav"

def play_alarm():
    """Play the alarm sound in a loop."""
    try:
        if mixer.get_init():
            mixer.music.load(alarm_file)
            mixer.music.play(-1)  # Loop indefinitely
            print("[AUDIO] Alarm sound playing...")
    except Exception as e:
        print(f"[ERROR] Error playing sound: {e}")

def stop_alarm():
    """Stop the alarm sound."""
    try:
        if mixer.get_init():
            mixer.music.stop()
            print("[AUDIO] Alarm sound stopped.")
    except Exception as e:
        print(f"[ERROR] Error stopping sound: {e}")

def medicine_alarm(name):
    print(f"\n=== [ALARM TRIGGERED] Time to take: {name}! ===")
    
    # 1. Show desktop notification
    try:
        notification.notify(
            title="Medicine Reminder",
            message=f"Time to take your {name}!",
            app_name="HealthMate",
            timeout=15
        )
    except Exception as e:
        print(f"[NOTIFICATION WARNING] Could not trigger desktop notification: {e}")
        
    # 2. Play alarm sound
    play_alarm()
    
    # 3. Enter interactive stop loop in terminal
    print(f"\n=====================================")
    print(f"   MEDICINE REMINDER: {name.upper()}   ")
    print(f"=====================================")
    print("- Press Enter or type 't' to mark as TAKEN.")
    print("- Type 's' to SNOOZE for 5 minutes.")
    print("=====================================")
    
    while True:
        try:
            choice = input("Your choice (Enter/Snooze): ").strip().lower()
            if choice in ['', 't', 'taken', 'y', 'yes']:
                stop_alarm()
                print(f"[STATUS] Great! You have taken {name}.\n")
                break
            elif choice in ['s', 'snooze']:
                stop_alarm()
                snooze_time = 5  # minutes
                print(f"[STATUS] Alarm snoozed for {snooze_time} minutes.\n")
                # Schedule a one-time reminder in snooze_time minutes
                schedule.every(snooze_time).minutes.do(snooze_alarm, name)
                break
            else:
                print("[ERROR] Invalid input. Press Enter to stop or 's' to snooze.")
        except KeyboardInterrupt:
            stop_alarm()
            print("\n[WARNING] Alarm stopped by user interrupt.")
            break

def snooze_alarm(name):
    # Trigger the alarm again
    medicine_alarm(name)
    # Return schedule.CancelJob to cancel this one-off job
    return schedule.CancelJob

def start_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    print("=====================================")
    print("      MEDICINE REMINDER SYSTEM       ")
    print("=====================================")
    print(f"Current local time: {time.strftime('%H:%M:%S')}")
    print("Schedules active:")
    print(" - 08:00 AM : Paracetamol")
    print(" - 02:00 PM : Vitamin Tablet")
    print(" - 09:00 PM : BP Medicine")
    
    # Schedule regular meds
    schedule.every().day.at("08:00").do(medicine_alarm, "Paracetamol")
    schedule.every().day.at("14:00").do(medicine_alarm, "Vitamin Tablet")
    schedule.every().day.at("21:00").do(medicine_alarm, "BP Medicine")
    
    # Offer to schedule a test reminder
    print("\nWould you like to schedule a test reminder?")
    print("1. Yes, in 5 seconds")
    print("2. No, just start standard scheduler")
    try:
        test_choice = input("Enter choice (1/2): ").strip()
        if test_choice == '1':
            test_med = input("Enter test medicine name (default: TestPill): ").strip() or "TestPill"
            print(f"Scheduling test reminder for {test_med} in 5 seconds...")
            # Trigger via a daemon thread after 5 seconds
            def trigger_later():
                time.sleep(5)
                medicine_alarm(test_med)
            threading.Thread(target=trigger_later, daemon=True).start()
    except (KeyboardInterrupt, SystemExit):
        sys.exit(0)
    except Exception:
        pass

    print("\nMedicine Reminder Running... Press Ctrl+C to exit.")
    try:
        start_scheduler()
    except KeyboardInterrupt:
        print("\nExiting Medicine Reminder. Stay healthy!")
