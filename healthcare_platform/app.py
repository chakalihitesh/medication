import streamlit as st
import datetime
import os
import database
import reminder
import chatbot
import ocr_scanner
import voice
import emergency
from PIL import Image

# Initialize Streamlit Page configurations
st.set_page_config(
    page_title="HealthMate AI - Healthcare Assistant",
    page_icon="💊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Start background medication scheduler
reminder.start_reminder_scheduler()

# Custom CSS for Premium Design & Aesthetics (Glassmorphism, custom buttons, scrollbars)
st.markdown("""
<style>
    /* Theme Font and Background modifications */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    /* Neomorphic cards */
    .health-card {
        background: #ffffff;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 8px 30px rgba(0, 82, 204, 0.04);
        border: 1px solid rgba(195, 198, 214, 0.3);
        margin-bottom: 20px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .health-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0, 82, 204, 0.08);
    }
    
    /* Vitals pills */
    .vital-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        background: rgba(10, 186, 115, 0.1);
        color: #0aba73;
        display: inline-block;
    }
    
    /* Chat bubbles styling */
    .user-bubble {
        background-color: #0052cc;
        color: #ffffff;
        padding: 12px 18px;
        border-radius: 18px 18px 0px 18px;
        margin-bottom: 12px;
        max-width: 80%;
        margin-left: auto;
        box-shadow: 0 4px 10px rgba(0, 82, 204, 0.15);
    }
    
    .bot-bubble {
        background-color: #edeef0;
        color: #191c1e;
        padding: 12px 18px;
        border-radius: 18px 18px 18px 0px;
        margin-bottom: 12px;
        max-width: 80%;
        border: 1px solid rgba(195, 198, 214, 0.2);
    }
    
    /* Header customizations */
    .brand-title {
        background: linear-gradient(135deg, #003d9b, #00687a);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
        font-size: 2.2rem;
    }
    
    /* Floating alert */
    .alarm-alert {
        background: rgba(222, 53, 11, 0.08);
        border: 1px solid rgba(222, 53, 11, 0.2);
        color: #DE350B;
        border-radius: 15px;
        padding: 16px;
        margin-bottom: 25px;
        animation: pulse 1.8s infinite;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# ACTIVE ALARM SYSTEM MONITOR (RENDERED AT TOP)
# ==========================================
active_alarm = reminder.get_active_alarm()
if active_alarm:
    st.markdown(f"""
    <div class="alarm-alert">
        <h4 style="margin:0; color:#DE350B; font-weight:700;">⏰ MEDICATION REMINDER ALARM ACTIVE!</h4>
        <p style="margin:5px 0 0 0; font-size:1.1rem;">
            It is time to take: <b>{active_alarm['name']}</b> ({active_alarm['dosage']}) - scheduled for {active_alarm['time']}.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, _ = st.columns([1, 1, 2])
    with col1:
        if st.button("✅ Mark as Taken", use_container_width=True, key="alarm_taken"):
            reminder.take_medication(active_alarm["id"], active_alarm["name"])
            st.rerun()
    with col2:
        if st.button("😴 Snooze (5 Mins)", use_container_width=True, key="alarm_snooze"):
            reminder.snooze_medication(active_alarm["id"], active_alarm["name"])
            st.rerun()

# ==========================================
# LAYOUT BRANDING HEADER
# ==========================================
col_header, col_logo = st.columns([5, 1])
with col_header:
    st.markdown('<h1 class="brand-title">HealthMate AI</h1>', unsafe_allow_html=True)
    st.write("Your production-grade, AI-powered healthcare assistant and medication companion.")
with col_logo:
    st.markdown("<h3>&#128138;&#127973;</h3>", unsafe_allow_html=True)

st.divider()

# Initialize Session States
if "chat_messages" not in st.session_state:
    st.session_state.chat_messages = database.get_chat_history()
if "tts_enabled" not in st.session_state:
    st.session_state.tts_enabled = False
if "voice_input" not in st.session_state:
    st.session_state.voice_input = ""

# ==========================================
# SIDEBAR CONTROLS
# ==========================================
with st.sidebar:
    st.markdown("### 🛠️ Platform Settings")
    
    # 1. API Status check
    api_key_check = os.getenv("GEMINI_API_KEY")
    if api_key_check:
        st.success("🟢 Gemini API Status: Connected")
    else:
        st.warning("🟡 Gemini API Status: Offline Mode")
        st.info("💡 To connect, add your `GEMINI_API_KEY` into the `.env` file.")
        
    # 2. Text-to-Speech Settings
    st.session_state.tts_enabled = st.checkbox("🔊 Read AI responses aloud (TTS)", value=st.session_state.tts_enabled)
    
    # 3. Emergency Quick Access
    st.markdown("---")
    st.markdown("### 🚨 Emergency Support")
    st.error("Emergency Contact: **911 / 112 / 102**")
    
    st.markdown("[🔍 Search Nearby Hospitals](%s)" % emergency.get_google_maps_link())
    st.write("Emergency keywords: *chest pain, breathing issue, severe bleeding, unconscious*")

# ==========================================
# NAVIGATION TABS
# ==========================================
tab_dashboard, tab_chat, tab_meds, tab_ocr, tab_logs = st.tabs([
    "📊 Health Dashboard", 
    "💬 AI Medical Assistant", 
    "🗓️ Medication Schedule", 
    "📸 Prescription Scanner (OCR)",
    "📜 History Logs"
])

# ------------------------------------------
# TAB 1: HEALTH DASHBOARD
# ------------------------------------------
with tab_dashboard:
    st.markdown("### 📈 Today's Health Vitals Summary")
    
    col_v1, col_v2, col_v3 = st.columns(3)
    
    with col_v1:
        st.markdown("""
        <div class="health-card">
            <span class="vital-badge">Normal</span>
            <h5 style="margin-top:10px; color:#737685;">❤️ Heart Rate</h5>
            <h2 style="margin:5px 0;">72 <span style="font-size:1.1rem; font-weight:normal; color:#737685;">bpm</span></h2>
            <p style="margin:0; font-size:0.85rem; color:#737685;">Resting rate healthy</p>
        </div>
        """, unsafe_allow_html=True)
        
    with col_v2:
        st.markdown("""
        <div class="health-card">
            <span class="vital-badge" style="background:rgba(0, 82, 204, 0.1); color:#0052cc;">Active</span>
            <h5 style="margin-top:10px; color:#737685;">👣 Daily Steps</h5>
            <h2 style="margin:5px 0;">8,450 <span style="font-size:1.1rem; font-weight:normal; color:#737685;">/ 10,000</span></h2>
            <p style="margin:0; font-size:0.85rem; color:#737685;">84% of daily target reached</p>
        </div>
        """, unsafe_allow_html=True)
        
    with col_v3:
        st.markdown("""
        <div class="health-card">
            <span class="vital-badge" style="background:rgba(106, 225, 255, 0.15); color:#006374;">Good</span>
            <h5 style="margin-top:10px; color:#737685;">🌙 Sleep Quality</h5>
            <h2 style="margin:5px 0;">7h 20m <span style="font-size:1.1rem; font-weight:normal; color:#737685;">(88%)</span></h2>
            <p style="margin:0; font-size:0.85rem; color:#737685;">Target: 8h 00m</p>
        </div>
        """, unsafe_allow_html=True)
        
    # Medication Progress Metric
    meds_list = database.get_all_medications()
    total_meds = len(meds_list)
    taken_meds = len([m for m in meds_list if m["status"] == "taken"])
    
    st.markdown("### 💊 Medication Adherence Tracking")
    col_m1, col_m2 = st.columns([1, 2])
    with col_m1:
        st.metric("Adherence Rate", f"{taken_meds}/{total_meds} Taken", f"{int(taken_meds/total_meds*100) if total_meds > 0 else 0}% Today")
    with col_m2:
        st.progress(taken_meds / total_meds if total_meds > 0 else 0.0)
        st.write("Ensuring you take medications on schedule dramatically reduces clinic risks.")

# ------------------------------------------
# TAB 2: AI HEALTH CHATBOT
# ------------------------------------------
with tab_chat:
    st.markdown("### 💬 Chat with HealthMate AI")
    st.write("Describe your symptoms, ask about medication instructions, or general diet recommendations.")
    
    # 1. Custom Voice Button for Speech Input
    col_speech_btn, col_speech_status = st.columns([1, 3])
    with col_speech_btn:
        if st.button("🎙️ Speak Command", use_container_width=True):
            with st.spinner("Listening... Speak clearly now."):
                voice_res = voice.listen_to_speech()
                if voice_res["success"]:
                    st.session_state.voice_input = voice_res["text"]
                    st.success(f"Recognized: '{voice_res['text']}'")
                else:
                    st.error(voice_res["error"])
                    
    # 2. Render Chat History
    chat_container = st.container(height=350)
    with chat_container:
        for msg in st.session_state.chat_messages:
            if msg["role"] == "user":
                st.markdown(f'<div class="user-bubble">{msg["message"]}</div>', unsafe_allow_html=True)
            else:
                st.markdown(f'<div class="bot-bubble">{msg["message"]}</div>', unsafe_allow_html=True)
                
    # 3. Chat Input Box (handles voice or text submission)
    chat_input_val = st.chat_input("Enter your symptom or question here...")
    
    # Check if voice input has been captured
    final_query = chat_input_val or st.session_state.voice_input
    
    if final_query:
        # Clear voice input session
        st.session_state.voice_input = ""
        
        # Immediate display user bubble
        with chat_container:
            st.markdown(f'<div class="user-bubble">{final_query}</div>', unsafe_allow_html=True)
            
        # Call chatbot backend
        with st.spinner("Analyzing..."):
            ai_output = chatbot.generate_ai_response(final_query, st.session_state.chat_messages)
            
        # Display bot bubble
        with chat_container:
            st.markdown(f'<div class="bot-bubble">{ai_output["text"]}</div>', unsafe_allow_html=True)
            
        # Handle Speech Synthesis (TTS) if checked
        if st.session_state.tts_enabled:
            # Speak only clean text, filtering the markdown disclaimer
            clean_speech = ai_output["text"].split("\n\n*Disclaimer:")[0]
            voice.speak_text(clean_speech)
            
        # Reload history messages
        st.session_state.chat_messages = database.get_chat_history()
        
        # If chatbot detected an emergency, show emergency modal right away!
        if ai_output["is_emergency"]:
            st.error("🚨 EMERGENCY SYMPTOM DETECTED! CALL EMERGENCY PROTOCOLS IMMEDIATELY.")
            
        st.rerun()

    # Clear Chat History Button
    if st.button("🗑️ Clear Chat History"):
        database.clear_chat_history()
        st.session_state.chat_messages = []
        st.rerun()

# ------------------------------------------
# TAB 3: MEDICATION SCHEDULER
# ------------------------------------------
with tab_meds:
    st.markdown("### 🗓️ Medication Schedule & Reminders")
    
    # Form to add new Medication
    st.markdown("#### ➕ Add New Medicine Schedule")
    with st.form("new_med_form", clear_on_submit=True):
        col_n1, col_n2 = st.columns(2)
        with col_n1:
            med_name = st.text_input("Medication Name", placeholder="e.g. Paracetamol")
            med_dosage = st.text_input("Dosage", placeholder="e.g. 500mg, 1 tablet")
        with col_n2:
            med_time = st.time_input("Reminder Time", value=datetime.time(8, 0))
            med_freq = st.selectbox("Frequency", ["Daily", "Twice a Day", "Weekly", "As Needed"])
            
        submitted = st.form_submit_button("Save Medication")
        if submitted:
            if med_name and med_dosage:
                # Format time string to 24h
                time_str = med_time.strftime("%H:%M")
                
                # Determine schedule category
                hour = med_time.hour
                if hour >= 12 and hour < 17:
                    sched_cat = "afternoon"
                elif hour >= 17 or hour < 6:
                    sched_cat = "evening"
                else:
                    sched_cat = "morning"
                    
                database.add_medication(med_name, time_str, med_dosage, med_freq, sched_cat)
                st.success(f"Successfully scheduled {med_name}!")
                st.rerun()
            else:
                st.error("Please enter a medicine name and dosage amount.")

    st.markdown("---")
    st.markdown("#### 📅 Active Medicine Lists")
    
    # Load medications
    medications = database.get_all_medications()
    
    # Divide into morning, afternoon, and evening schedules
    morn = [m for m in medications if m["schedule"] == "morning"]
    aft = [m for m in medications if m["schedule"] == "afternoon"]
    eve = [m for m in medications if m["schedule"] == "evening"]
    
    # Render schedules in 3 Columns
    col_m, col_a, col_e = st.columns(3)
    
    with col_m:
        st.subheader("🌅 Morning Schedule")
        for med in morn:
            with st.container(border=True):
                st.markdown(f"**💊 {med['name']}**")
                st.write(f"Dosage: {med['dosage']}")
                st.write(f"⏰ Time: {med['time']} | Status: `{med['status'].upper()}`")
                
                # Interactive toggle button
                btn_label = "Mark Taken" if med["status"] == "pending" else "Mark Pending"
                target_status = "taken" if med["status"] == "pending" else "pending"
                
                c_b1, c_b2 = st.columns(2)
                with c_b1:
                    if st.button(btn_label, key=f"tog_{med['id']}", use_container_width=True):
                        database.update_medication_status(med["id"], target_status)
                        database.log_action(med["name"], target_status)
                        st.rerun()
                with c_b2:
                    if st.button("🗑️ Delete", key=f"del_{med['id']}", use_container_width=True):
                        database.delete_medication(med["id"])
                        st.rerun()
                        
    with col_a:
        st.subheader("Afternoon Schedule")
        for med in aft:
            with st.container(border=True):
                st.markdown(f"**{med['name']}**")
                st.write(f"Dosage: {med['dosage']}")
                st.write(f"Time: {med['time']} | Status: `{med['status'].upper()}`")
                
                btn_label = "Mark Taken" if med["status"] == "pending" else "Mark Pending"
                target_status = "taken" if med["status"] == "pending" else "pending"
                
                c_b1, c_b2 = st.columns(2)
                with c_b1:
                    if st.button(btn_label, key=f"aft_tog_{med['id']}", use_container_width=True):
                        database.update_medication_status(med["id"], target_status)
                        database.log_action(med["name"], target_status)
                        st.rerun()
                with c_b2:
                    if st.button("Delete", key=f"aft_del_{med['id']}", use_container_width=True):
                        database.delete_medication(med["id"])
                        st.rerun()
                        
    with col_e:
        st.subheader("Evening Schedule")
        for med in eve:
            with st.container(border=True):
                st.markdown(f"**{med['name']}**")
                st.write(f"Dosage: {med['dosage']}")
                st.write(f"Time: {med['time']} | Status: `{med['status'].upper()}`")
                
                btn_label = "Mark Taken" if med["status"] == "pending" else "Mark Pending"
                target_status = "taken" if med["status"] == "pending" else "pending"
                
                c_b1, c_b2 = st.columns(2)
                with c_b1:
                    if st.button(btn_label, key=f"eve_tog_{med['id']}", use_container_width=True):
                        database.update_medication_status(med["id"], target_status)
                        database.log_action(med["name"], target_status)
                        st.rerun()
                with c_b2:
                    if st.button("Delete", key=f"eve_del_{med['id']}", use_container_width=True):
                        database.delete_medication(med["id"])
                        st.rerun()

# ------------------------------------------
# TAB 4: PRESCRIPTION SCANNER (OCR)
# ------------------------------------------
with tab_ocr:
    st.markdown("### 📸 OCR Prescription Scanner")
    st.write("Upload a prescription image or run a demo file to extract medicines automatically and schedule alerts.")
    
    # Select demo or custom upload
    scan_option = st.selectbox("Choose Prescription Input Source", ["Demo Prescription 1 (Amoxicillin)", "Demo Prescription 2 (Metformin)", "Upload My Own Prescription Image"])
    
    selected_img = None
    demo_filename = None
    
    if scan_option == "Demo Prescription 1 (Amoxicillin)":
        demo_filename = "demo_amoxicillin.png"
        st.info("📎 Demo Selected: St. Jude Medical Clinic - Amoxicillin 500mg. Press 'Scan Prescription' below.")
    elif scan_option == "Demo Prescription 2 (Metformin)":
        demo_filename = "demo_metformin.png"
        st.info("📎 Demo Selected: Metropolitan Care Hospital - Metformin 850mg. Press 'Scan Prescription' below.")
    else:
        selected_img = st.file_uploader("Upload prescription photo (PNG, JPG, JPEG)", type=["png", "jpg", "jpeg"])
        
    if st.button("🔍 Scan Prescription"):
        with st.spinner("Running Heuristic/OCR Text Extraction..."):
            if demo_filename:
                res = ocr_scanner.scan_prescription(None, demo_key=demo_filename)
            elif selected_img:
                res = ocr_scanner.scan_prescription(selected_img)
            else:
                st.error("Please upload a file or choose a demo prescription.")
                res = None
                
            if res and res["success"]:
                st.session_state.ocr_results = res
                st.success("Prescription text extracted successfully!")
                
    # If scanner results exist in session state, display them
    if "ocr_results" in st.session_state:
        ocr_res = st.session_state.ocr_results
        
        st.divider()
        col_ocr_l, col_ocr_r = st.columns(2)
        
        with col_ocr_l:
            st.markdown("#### 📝 Raw OCR Extracted Text")
            st.code(ocr_res["raw_text"], language="text")
            st.caption(f"Engine source: {ocr_res['source']}")
            
        with col_ocr_r:
            st.markdown("#### 🎯 Identified Prescription Details")
            extracted = ocr_res["extracted_data"]
            
            st.write(f"**Medicine Name**: `{extracted['name']}`")
            st.write(f"**Dosage**: `{extracted['dosage']}`")
            st.write(f"**Frequency**: `{extracted['frequency']}`")
            st.write(f"**Suggested Time**: `{extracted['time']}`")
            
            st.markdown("---")
            st.write("Would you like to schedule a daily medicine reminder for this medication?")
            
            # One-click button to save to SQLite database
            if st.button("💾 One-Click Schedule Reminder", use_container_width=True):
                # Categorize schedule
                hour_parsed = int(extracted["time"].split(":")[0])
                if hour_parsed >= 12 and hour_parsed < 17:
                    cat = "afternoon"
                elif hour_parsed >= 17 or hour_parsed < 6:
                    cat = "evening"
                else:
                    cat = "morning"
                    
                database.add_medication(extracted["name"], extracted["time"], extracted["dosage"], extracted["frequency"], cat)
                st.success(f"Reminder added for {extracted['name']} at {extracted['time']}!")
                # Clear session state scan
                del st.session_state.ocr_results
                st.rerun()

# ------------------------------------------
# TAB 5: HISTORY LOGS
# ------------------------------------------
with tab_logs:
    st.markdown("### 📜 Medication Action History Logs")
    st.write("Real-time SQLite transaction logs verifying alarm triggers, takes, and snoozes.")
    
    logs = database.get_logs()
    
    if logs:
        st.table(logs)
    else:
        st.info("No medication actions have been logged yet. The history will populate once alarms are triggered and marked as taken.")
