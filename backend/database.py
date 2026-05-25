import sqlite3
import datetime
import os
import hashlib

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "healthcare.db")

def get_user_db_path(user_email: str) -> str:
    # Hash the email to create a safe, user-specific database filename
    email_hash = hashlib.sha256(user_email.lower().strip().encode('utf-8')).hexdigest()
    return os.path.join(DB_DIR, f"healthcare_user_{email_hash[:16]}.db")

def get_main_db_connection():
    """Establishes connection to the main central database (holding users)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_db_connection(user_email=None):
    """Establishes a connection to the SQLite database."""
    if not user_email or user_email == "default@healthmate.ai":
        db_path = DB_PATH
        init_user_db_in_main()
    else:
        db_path = get_user_db_path(user_email)
        init_user_db(user_email)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Enables access to columns by name like dictionary keys
    return conn

def init_user_db_in_main():
    """Initializes user tables inside the main database for the guest user."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Medications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        time TEXT NOT NULL,         -- Stored in 24h format (HH:MM)
        dosage TEXT NOT NULL,       -- e.g. "1 capsule", "500mg"
        frequency TEXT NOT NULL,    -- e.g. "Daily", "Weekly"
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'taken', 'missed'
        schedule TEXT NOT NULL      -- 'morning', 'afternoon', 'evening'
    )
    """)
    
    # 2. Chat History Table (for multi-turn AI context and dashboard chat UI)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        role TEXT NOT NULL,         -- 'user' or 'assistant'
        message TEXT NOT NULL
    )
    """)
    
    # 3. Reminder Action Log Table (for analytics and patient reports)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        medication_name TEXT NOT NULL,
        action TEXT NOT NULL        -- 'taken', 'snoozed', 'triggered', 'missed'
    )
    """)

    # 4. Smartwatch Vitals Table (Heart Rate and Steps)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        heart_rate INTEGER NOT NULL,
        steps INTEGER NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

def init_user_db(user_email: str):
    """Initializes user-specific database file with user-isolated tables."""
    db_path = get_user_db_path(user_email)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Medications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        time TEXT NOT NULL,         -- Stored in 24h format (HH:MM)
        dosage TEXT NOT NULL,       -- e.g. "1 capsule", "500mg"
        frequency TEXT NOT NULL,    -- e.g. "Daily", "Weekly"
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'taken', 'missed'
        schedule TEXT NOT NULL      -- 'morning', 'afternoon', 'evening'
    )
    """)
    
    # 2. Chat History Table (for multi-turn AI context and dashboard chat UI)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        role TEXT NOT NULL,         -- 'user' or 'assistant'
        message TEXT NOT NULL
    )
    """)
    
    # 3. Reminder Action Log Table (for analytics and patient reports)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        medication_name TEXT NOT NULL,
        action TEXT NOT NULL        -- 'taken', 'snoozed', 'triggered', 'missed'
    )
    """)

    # 4. Smartwatch Vitals Table (Heart Rate and Steps)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        heart_rate INTEGER NOT NULL,
        steps INTEGER NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()

def init_db():
    """Initializes the main database by creating the users table if it does not exist."""
    print("[DB] Initializing main database...")
    conn = get_main_db_connection()
    cursor = conn.cursor()
    
    # Central Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        otp TEXT,
        is_verified INTEGER DEFAULT 0
    )
    """)
    
    conn.commit()
    conn.close()
    
    # Also initialize patient tables in the main database
    init_user_db_in_main()
    print("[DB] Main database initialized successfully.")


# ==========================================
# MEDICATION CRUD FUNCTIONS
# ==========================================

def add_medication(name, time_str, dosage, frequency, schedule, user_email=None):
    """Inserts a new medication reminder schedule into the database."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO medications (name, time, dosage, frequency, status, schedule) VALUES (?, ?, ?, ?, 'pending', ?)",
        (name, time_str, dosage, frequency, schedule)
    )
    conn.commit()
    conn.close()
    print(f"[DB] Added medication reminder: {name} at {time_str} for user {user_email}")

def get_all_medications(user_email=None):
    """Fetches all medication schedules from the database."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medications ORDER BY time ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_medication_status(med_id, status, user_email=None):
    """Updates the taken/pending status of a specific medication."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("UPDATE medications SET status = ? WHERE id = ?", (status, med_id))
    conn.commit()
    conn.close()
    print(f"[DB] Updated medication ID {med_id} status to '{status}' for user {user_email}")

def delete_medication(med_id, user_email=None):
    """Removes a medication schedule from the database."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM medications WHERE id = ?", (med_id,))
    conn.commit()
    conn.close()
    print(f"[DB] Deleted medication ID {med_id} for user {user_email}")

def reset_daily_statuses(user_email=None):
    """Resets all medication statuses back to 'pending' (used at midnight or on app startup)."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("UPDATE medications SET status = 'pending'")
    conn.commit()
    conn.close()
    print(f"[DB] Reset all medication statuses to 'pending' for user {user_email}")

# ==========================================
# CHAT HISTORY FUNCTIONS
# ==========================================

def save_chat_message(role, message, user_email=None):
    """Saves a conversation message in the database for AI context retention."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (role, message) VALUES (?, ?)",
        (role, message)
    )
    conn.commit()
    conn.close()

def get_chat_history(limit=50, user_email=None):
    """Retrieves the recent conversation history messages."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history ORDER BY timestamp ASC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_chat_history(user_email=None):
    """Clears all logged messages in the conversation history table."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM history")
    conn.commit()
    conn.close()
    print(f"[DB] Chat history cleared for user {user_email}")

# ==========================================
# REMINDER HISTORY LOGS FUNCTIONS
# ==========================================

def log_action(medication_name, action, user_email=None):
    """Creates an entry in the event log when alarms trigger, or are taken/snoozed."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO logs (medication_name, action) VALUES (?, ?)",
        (medication_name, action)
    )
    conn.commit()
    conn.close()
    print(f"[DB] Logged action '{action}' for medication '{medication_name}' for user {user_email}")

def get_logs(limit=100, user_email=None):
    """Fetches the event log history sorted by timestamp (most recent first)."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ==========================================
# SMARTWATCH VITALS FUNCTIONS
# ==========================================

def log_vitals(heart_rate, steps, user_email=None):
    """Logs smartwatch telemetry data (BPM, step count) to the database."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vitals (heart_rate, steps) VALUES (?, ?)",
        (heart_rate, steps)
    )
    conn.commit()
    conn.close()

def get_vitals_history(limit=100, user_email=None):
    """Retrieves recorded vitals telemetry logs."""
    conn = get_db_connection(user_email)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vitals ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ==========================================
# USER MANAGEMENT & AUTHENTICATION FUNCTIONS
# ==========================================

def register_user(email: str):
    """Registers a new user (unverified by default)."""
    conn = get_main_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT OR IGNORE INTO users (email, is_verified) VALUES (?, 0)", (email.lower().strip(),))
        conn.commit()
    except Exception as e:
        print(f"[DB ERROR] register_user: {e}")
    finally:
        conn.close()

def create_or_update_otp(email: str, otp: str):
    """Sets or updates the OTP for the user email."""
    conn = get_main_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT OR IGNORE INTO users (email, is_verified) VALUES (?, 0)", (email.lower().strip(),))
        cursor.execute("UPDATE users SET otp = ? WHERE email = ?", (otp, email.lower().strip()))
        conn.commit()
    except Exception as e:
        print(f"[DB ERROR] create_or_update_otp: {e}")
    finally:
        conn.close()

def verify_user_otp(email: str, otp: str) -> bool:
    """Verifies user's OTP and marks them as verified if correct."""
    conn = get_main_db_connection()
    cursor = conn.cursor()
    success = False
    try:
        cursor.execute("SELECT otp FROM users WHERE email = ?", (email.lower().strip(),))
        row = cursor.fetchone()
        if row and row['otp'] == otp:
            cursor.execute("UPDATE users SET is_verified = 1, otp = NULL WHERE email = ?", (email.lower().strip(),))
            conn.commit()
            success = True
            init_user_db(email)
    except Exception as e:
        print(f"[DB ERROR] verify_user_otp: {e}")
    finally:
        conn.close()
    return success

def register_password(email: str, password_hash: str):
    """Registers/updates user's password hash."""
    conn = get_main_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (password_hash, email.lower().strip()))
        conn.commit()
    except Exception as e:
        print(f"[DB ERROR] register_password: {e}")
    finally:
        conn.close()

def authenticate_user(email: str, password_hash: str) -> bool:
    """Verifies that user exists, is verified, and password matches."""
    conn = get_main_db_connection()
    cursor = conn.cursor()
    authenticated = False
    try:
        cursor.execute("SELECT password_hash, is_verified FROM users WHERE email = ?", (email.lower().strip(),))
        row = cursor.fetchone()
        if row and row['is_verified'] == 1 and row['password_hash'] == password_hash:
            authenticated = True
    except Exception as e:
        print(f"[DB ERROR] authenticate_user: {e}")
    finally:
        conn.close()
    return authenticated

def get_all_users() -> list[str]:
    """Retrieves all verified users' emails."""
    conn = get_main_db_connection()
    cursor = conn.cursor()
    users = []
    try:
        cursor.execute("SELECT email FROM users WHERE is_verified = 1")
        rows = cursor.fetchall()
        users = [row['email'] for row in rows]
    except Exception as e:
        print(f"[DB ERROR] get_all_users: {e}")
    finally:
        conn.close()
    return users



# Initialize database on module loading to prevent startup missing table errors
if not os.path.exists(DB_PATH):
    init_db()
else:
    init_db()  # Run to ensure the new table is created if it didn't exist before

