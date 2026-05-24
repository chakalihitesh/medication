import sqlite3
import datetime
import os

DB_PATH = "healthcare.db"

def get_db_connection():
    """Establishes a connection to the SQLite database and returns the connection object."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Enables access to columns by name like dictionary keys
    return conn

def init_db():
    """Initializes the database by creating all required tables if they do not exist."""
    print("[DB] Initializing database...")
    conn = get_db_connection()
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
    print("[DB] Database initialized successfully.")


# ==========================================
# MEDICATION CRUD FUNCTIONS
# ==========================================

def add_medication(name, time_str, dosage, frequency, schedule):
    """Inserts a new medication reminder schedule into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO medications (name, time, dosage, frequency, schedule) VALUES (?, ?, ?, ?, ?)",
        (name, time_str, dosage, frequency, schedule)
    )
    conn.commit()
    conn.close()
    print(f"[DB] Added medication reminder: {name} at {time_str}")

def get_all_medications():
    """Fetches all medication schedules from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medications ORDER BY time ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_medication_status(med_id, status):
    """Updates the taken/pending status of a specific medication."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE medications SET status = ? WHERE id = ?", (status, med_id))
    conn.commit()
    conn.close()
    print(f"[DB] Updated medication ID {med_id} status to '{status}'")

def delete_medication(med_id):
    """Removes a medication schedule from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM medications WHERE id = ?", (med_id,))
    conn.commit()
    conn.close()
    print(f"[DB] Deleted medication ID {med_id}")

def reset_daily_statuses():
    """Resets all medication statuses back to 'pending' (used at midnight or on app startup)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE medications SET status = 'pending'")
    conn.commit()
    conn.close()
    print("[DB] Reset all medication statuses to 'pending' for the new day.")

# ==========================================
# CHAT HISTORY FUNCTIONS
# ==========================================

def save_chat_message(role, message):
    """Saves a conversation message in the database for AI context retention."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (role, message) VALUES (?, ?)",
        (role, message)
    )
    conn.commit()
    conn.close()

def get_chat_history(limit=50):
    """Retrieves the recent conversation history messages."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history ORDER BY timestamp ASC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_chat_history():
    """Clears all logged messages in the conversation history table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM history")
    conn.commit()
    conn.close()
    print("[DB] Chat history cleared.")

# ==========================================
# REMINDER HISTORY LOGS FUNCTIONS
# ==========================================

def log_action(medication_name, action):
    """Creates an entry in the event log when alarms trigger, or are taken/snoozed."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO logs (medication_name, action) VALUES (?, ?)",
        (medication_name, action)
    )
    conn.commit()
    conn.close()
    print(f"[DB] Logged action '{action}' for medication '{medication_name}'")

def get_logs(limit=100):
    """Fetches the event log history sorted by timestamp (most recent first)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# ==========================================
# SMARTWATCH VITALS FUNCTIONS
# ==========================================

def log_vitals(heart_rate, steps):
    """Logs smartwatch telemetry data (BPM, step count) to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO vitals (heart_rate, steps) VALUES (?, ?)",
        (heart_rate, steps)
    )
    conn.commit()
    conn.close()

def get_vitals_history(limit=100):
    """Retrieves recorded vitals telemetry logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vitals ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# Initialize database on module loading to prevent startup missing table errors
if not os.path.exists(DB_PATH):
    init_db()
else:
    init_db()  # Run to ensure the new table is created if it didn't exist before

