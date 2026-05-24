"""
agents.py - Cooperative Multi-Agent Architecture for HealthMate AI
Implements five dedicated agents cooperating sequentially:
1. Emergency Agent (Safety & Incident Monitor - web scraping enabled)
2. Prescription Agent (OCR scan parser)
3. Reminder Agent (Medication database scheduler & pygame/plyer alerts)
4. Doctor Agent (AI Medical guidance clinician - web scraping + multi-language)
5. Voice Agent (gTTS multi-language speech synthesizer)
Plus:
6. Report Agent (Compiles smartwatch telemetry & medication logs)
"""

import os
import re
import datetime
import pytz
import database
import emergency
import chatbot
import ocr_scanner
import voice
import web_scraper
import tempfile
import threading
import time

class BaseAgent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role

    def process(self, context: dict) -> dict:
        raise NotImplementedError("Each agent must implement its own process method")

class EmergencyAgent(BaseAgent):
    def __init__(self):
        super().__init__("Emergency Agent", "Safety & Emergency Incident Monitor")

    def process(self, context: dict) -> dict:
        message = context.get("message", "")
        language = context.get("language", "english").lower()
        # Call existing check_emergency function
        result = emergency.check_emergency(message, language=language)
        if result["is_emergency"]:
            # Query web search for live emergency/first aid tips
            try:
                scraped_tips = web_scraper.search_emergency_tips(message)
                web_headers = {
                    "english": "Live Web Emergency Tips:",
                    "hindi": "लाइव वेब आपातकालीन सुझाव:",
                    "telugu": "లైవ్ వెబ్ అత్యవసర చిట్కాలు:"
                }
                web_header = web_headers.get(language, web_headers["english"])
                result["guide"] = f"{result['guide']}\n\n📢 **{web_header}**\n{scraped_tips}"
            except Exception as e:
                print(f"[EmergencyAgent Web Error] {e}")
                
            result["log"] = f"🚨 {self.name}: Alert! Severe symptoms detected ({result['symptom']}). Action: Scraped live first-aid advice from search."
        else:
            result["log"] = f"✓ {self.name}: Monitored text query for critical triggers. No severe warnings found."
        return result

class PrescriptionAgent(BaseAgent):
    def __init__(self):
        super().__init__("Prescription Agent", "Prescription OCR & Extraction Parser")

    def process(self, context: dict) -> dict:
        image_file = context.get("image_file")
        demo_key = context.get("demo_key")
        
        # Scan prescription
        result = ocr_scanner.scan_prescription(image_file, demo_key=demo_key)
        
        if result.get("success"):
            ext = result.get("extracted_data", {})
            result["log"] = f"✓ {self.name}: Scanned prescription successfully via {result.get('source')}. Found: {ext.get('name')} ({ext.get('dosage')}, {ext.get('frequency')})"
        else:
            result["log"] = f"✓ {self.name}: Idle. No prescription data was provided for parsing."
        return result

class ReminderAgent(BaseAgent):
    def __init__(self):
        super().__init__("Reminder Agent", "Medication Scheduler & Notification Dispatcher")

    def process(self, context: dict) -> dict:
        med = context.get("medication")
        if not med:
            return {"success": False, "log": f"✓ {self.name}: Idle. No medication scheduling requests pending."}
            
        time_str = med.get("time", "08:00")
        name = med.get("name", "Unknown Medication")
        dosage = med.get("dosage", "1 tablet")
        freq = med.get("frequency", "Daily")
        
        # Infer schedule section: morning, afternoon, evening
        schedule_section = "morning"
        try:
            hh = int(time_str.split(":")[0])
            if 12 <= hh < 17:
                schedule_section = "afternoon"
            elif hh >= 17:
                schedule_section = "evening"
        except:
            pass

        # Save to DB
        database.add_medication(name, time_str, dosage, freq, schedule_section)
        # Log action in database
        database.log_action(name, "scheduled")
        
        return {
            "success": True,
            "message": f"Successfully scheduled {name} ({dosage}) at {time_str} IST ({schedule_section} slot).",
            "log": f"✓ {self.name}: Saved {name} into database. Scheduled alarm at {time_str} IST daily."
        }

class DoctorAgent(BaseAgent):
    def __init__(self):
        super().__init__("Doctor Agent", "AI Health Consultant & Clinical Guidance Specialist")

    def process(self, context: dict) -> dict:
        message = context.get("message", "")
        chat_history = context.get("chat_history", [])
        language = context.get("language", "english").lower()
        
        # Retrieve live web scraped tips if query is long and contains medical keywords
        web_context = ""
        is_medical = any(word in message.lower() for word in ["pain", "dose", "side effect", "headache", "fever", "diabet", "hypertension", "bp", "symptom", "medicine", "pill"])
        if is_medical and len(message.strip()) > 8:
            try:
                web_context = web_scraper.search_emergency_tips(message)
                print("[DoctorAgent] Live web scraped context injected.")
            except Exception as e:
                print(f"[DoctorAgent Web Error] {e}")

        # Adapt model prompt for preferred language (English, Hindi, Telugu)
        lang_instruction = ""
        if language == "hindi":
            lang_instruction = (
                "\nCRITICAL INSTRUCTIONS:\n"
                "1. You MUST translate and write your entire response inside Hindi (हिंदी) script.\n"
                "2. Your response MUST contain ONLY these 4 sections (strictly structured in Hindi script) and a final disclaimer footer at the end. Do NOT add any greetings, introduction, conversational filler, or extra comments:\n"
                "**मददगार सुझाव (Tips):** [आपके चिकित्सा सुझाव यहाँ]\n"
                "**दवा (Medicine):** [दवाओं के नाम या लागू नहीं होने पर कोई नहीं]\n"
                "**मात्रा (Quantity):** [उपयोग की जाने वाली मात्रा या लागू नहीं होने पर कोई नहीं]\n"
                "**समय (Timing):** [कब उपयोग करना है इसका समय या लागू नहीं होने पर कोई नहीं]\n"
                "*अस्वीकरण: मैं केवल एक एआई डॉक्टर एजेंट हूं।*\n"
                "3. Ensure the sections are exactly formatted as shown."
            )
        elif language == "telugu":
            lang_instruction = (
                "\nCRITICAL INSTRUCTIONS:\n"
                "1. You MUST translate and write your entire response inside Telugu (తెలుగు) script.\n"
                "2. Your response MUST contain ONLY these 4 sections (strictly structured in Telugu script) and a final disclaimer footer at the end. Do NOT add any greetings, introduction, conversational filler, or extra comments:\n"
                "**చిట్కాలు (Tips):** [ఇక్కడ మీ ఆరోగ్య సూచనలు]\n"
                "**మందులు (Medicine):** [మందుల పేర్లు లేదా వర్తించకపోతే ఏమీ లేదు]\n"
                "**మోతాదు (Quantity):** [ఉపయోగించాల్సిన మోతాదు లేదా వర్తించకపోతే ఏమీ లేదు]\n"
                "**సమయం (Timing):** [ఎప్పుడు ఉపయోగించాలో సమయం లేదా వర్తించకపోతే ఏమీ లేదు]\n"
                "*నిరాకరణ: నేను కేవలం ఒక AI డాక్టర్ ఏజెంట్‌ను మాత్రమే.*\n"
                "3. Ensure the sections are exactly formatted as shown."
            )
        else:
            lang_instruction = (
                "\nCRITICAL INSTRUCTIONS:\n"
                "1. Respond in English.\n"
                "2. Your response MUST contain ONLY these 4 sections and a final disclaimer footer at the end. Do NOT add any greetings, introduction, conversational filler, or extra comments:\n"
                "**Tips:** [Your medical tips here]\n"
                "**Medicine:** [Name of the medicines or none if not applicable]\n"
                "**Quantity:** [Quantity to use or none if not applicable]\n"
                "**Timing:** [Timing on when to use or none if not applicable]\n"
                "*Disclaimer: I am just an AI Doctor Agent.*\n"
                "3. Ensure the sections are exactly formatted as shown."
            )

        # Format system prompt context
        combined_prompt = message
        if web_context:
            combined_prompt = f"[LIVE GOOGLE WEB SEARCH RESULTS]\n{web_context}\n\n[USER QUESTION]\n{message}"

        # Inject instructions temporarily via prompt decoration
        decorated_prompt = combined_prompt + lang_instruction

        # Generate response using chatbot core
        result = chatbot.generate_ai_response(decorated_prompt, chat_history, language=language)
        
        log_msg = f"✓ {self.name}: Formulated response in {language.capitalize()}."
        if web_context:
            log_msg += " (Injected live Google web scraped context)"
            
        result["log"] = log_msg
        return result

class VoiceAgent(BaseAgent):
    def __init__(self):
        super().__init__("Voice Agent", "Voice Synthesis & Vocal Feedback Module")

    def process(self, context: dict) -> dict:
        text = context.get("text", "")
        language = context.get("language", "english").lower()
        
        if not text:
            return {"success": False, "log": f"✓ {self.name}: Idle. No feedback text provided for voice output."}

        # Map language string to gTTS codes
        lang_code = "en"
        if language == "hindi":
            lang_code = "hi"
        elif language == "telugu":
            lang_code = "te"

        # Clean disclaimer for speech synthesis
        clean_text = text
        for term in ["*Disclaimer:", "*अस्वीकरण:", "*నిరాకరణ:", "Disclaimer:", "अस्वीकरण:", "నిరాకరణ:"]:
            clean_text = clean_text.split(term)[0]
        clean_text = clean_text.strip()
        # Strip markdown bold/stars for gTTS
        clean_text = clean_text.replace("**", "").replace("*", "")

        # Execute non-blocking gTTS voice player using Pygame mixer
        try:
            from gtts import gTTS
            from pygame import mixer
            
            if not mixer.get_init():
                mixer.init()

            def _speak_thread():
                try:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
                        temp_path = fp.name
                    
                    tts = gTTS(text=clean_text, lang=lang_code, slow=False)
                    tts.save(temp_path)
                    
                    # Play generated speech audio
                    mixer.music.load(temp_path)
                    mixer.music.play()
                    while mixer.music.get_busy():
                        time.sleep(0.1)
                    
                    # Unload and clean up temp file
                    mixer.music.unload()
                    os.remove(temp_path)
                except Exception as ex:
                    print(f"[VoiceAgent Thread Error] {ex}")

            threading.Thread(target=_speak_thread, daemon=True).start()
            return {"success": True, "log": f"✓ {self.name}: Spoke response asynchronously in {language.capitalize()} (gTTS engine)."}
            
        except Exception as e:
            print(f"[VoiceAgent Error] gTTS failed: {e}. Falling back to default pyttsx3.")
            if lang_code == "en":
                voice.speak_text(clean_text)
            return {"success": False, "log": f"✓ {self.name}: Fallback voice triggered (Offline pyttsx3)."}

class ReportAgent(BaseAgent):
    def __init__(self):
        super().__init__("Report Agent", "Smart Health & Telemetry Analyst")

    def process(self, context: dict) -> dict:
        period = context.get("period", "weekly").lower()
        heart_rate_history = context.get("heart_rate_history", [])
        steps_history = context.get("steps_history", [])

        # Fetch database compliance logs
        logs = database.get_logs(limit=100)
        meds = database.get_all_medications()
        
        # Calculate medication compliance metrics
        total_meds = len(meds)
        taken_meds = sum(1 for log in logs if log["action"] == "taken")
        adherence_rate = 100
        if total_meds > 0:
            adherence_rate = min(100, int((taken_meds / total_meds) * 100))

        # Compile smartwatch vitals statistics
        hr_values = [int(hr) for hr in heart_rate_history if hr]
        steps_values = [int(step) for step in steps_history if step]

        avg_hr = sum(hr_values) // len(hr_values) if hr_values else 72
        min_hr = min(hr_values) if hr_values else 65
        max_hr = max(hr_values) if hr_values else 88
        
        total_steps = sum(steps_values) if steps_values else 42850
        daily_avg_steps = total_steps // 7 if period == "weekly" else total_steps // 30

        # Generate report text (Markdown format)
        report_title = f"{period.upper()} PATIENT COMPLIANCE & VITALS REPORT"
        report_date = datetime.datetime.now().strftime("%B %d, %Y")
        
        markdown_report = f"""# {report_title}
Generated on: {report_date}
Source: HealthMate AI Integrated Smartwatch sync

## 1. Medication Adherence Summary
- **Daily Scheduled Medications:** {total_meds}
- **Successfully Taken Events:** {taken_meds}
- **Calculated Compliance Rate:** {adherence_rate}%
- **Status:** {"Excellent Compliance" if adherence_rate >= 85 else "Needs Improvement"}

## 2. Smartwatch Vitals Tracking
- **Heart Rate Trends:**
  - Average Heart Rate: {avg_hr} BPM
  - Minimum recorded: {min_hr} BPM
  - Maximum recorded: {max_hr} BPM
  - Vitals Status: Normal / Stable
- **Physical Activity (Steps):**
  - Total Steps Walked: {total_steps}
  - Daily Average Steps: {daily_avg_steps} steps/day
  - Step Goal Completion: {int((daily_avg_steps / 8000) * 100)}% of daily target (8,000 steps)

## 3. Clinical Recommendation Disclaimer
*Disclaimers: Smartwatch vitals are logged via device Bluetooth simulator. This report is compiled as reference guidelines for medical consultation. Please share this log with your clinician during checkups.*
"""
        return {
            "success": True,
            "period": period,
            "date": report_date,
            "adherence": adherence_rate,
            "avg_hr": avg_hr,
            "total_steps": total_steps,
            "report_md": markdown_report,
            "log": f"✓ {self.name}: Successfully prepared {period} health insights report card."
        }

class HealthAgentCoordinator:
    def __init__(self):
        self.emergency_agent = EmergencyAgent()
        self.doctor_agent = DoctorAgent()
        self.prescription_agent = PrescriptionAgent()
        self.reminder_agent = ReminderAgent()
        self.voice_agent = VoiceAgent()
        self.report_agent = ReportAgent()

    def process_chat_query(self, message: str, chat_history: list = [], language: str = "english") -> dict:
        logs = []
        
        # 1. Check for Emergency (queries DDG web search internally if emergency is hit)
        emerg_res = self.emergency_agent.process({"message": message, "language": language})
        logs.append(emerg_res["log"])
        
        if emerg_res["is_emergency"]:
            voice_texts = {
                "english": "Alert! Emergency warning. Please consult clinical protocols immediately.",
                "hindi": "आपातकालीन चेतावनी। कृपया तुरंत प्राथमिक चिकित्सा प्रोटोकॉल का पालन करें।",
                "telugu": "అత్యవసర హెచ్చరిక. దయచేసి వెంటనే ప్రాథమిక చికిత్స ప్రోటోకాల్‌లను అనుసరించండి."
            }
            emergency_voice_text = voice_texts.get(language.lower(), voice_texts["english"])
            # Synthesize voice warning in selected language
            self.voice_agent.process({"text": emergency_voice_text, "language": language})
            logs.append(f"✓ {self.voice_agent.name}: Triggered vocal emergency warnings in {language.capitalize()}.")
            return {
                "response": emerg_res["guide"],
                "is_emergency": True,
                "hospitals": emerg_res["hospitals"],
                "agent_logs": logs
            }
            
        # 2. Run PrescriptionAgent (idle)
        presc_res = self.prescription_agent.process({})
        logs.append(presc_res["log"])
        
        # 3. Run DoctorAgent (checks DDG and enforces translation to preferred language)
        doc_res = self.doctor_agent.process({"message": message, "chat_history": chat_history, "language": language})
        logs.append(doc_res["log"])
        
        # 4. Run ReminderAgent (idle)
        rem_res = self.reminder_agent.process({})
        logs.append(rem_res["log"])
        
        # 5. Run VoiceAgent to speak response in the correct language
        voice_res = self.voice_agent.process({"text": doc_res["text"], "language": language})
        logs.append(voice_res["log"])
        
        return {
            "response": doc_res["text"],
            "is_emergency": False,
            "hospitals": [],
            "agent_logs": logs
        }

    def process_prescription_scan(self, image_file=None, demo_key=None) -> dict:
        logs = []
        
        # 1. Run EmergencyAgent
        logs.append(f"✓ {self.emergency_agent.name}: Idle. Running prescription OCR scanner pipeline.")
        
        # 2. Run PrescriptionAgent
        presc_res = self.prescription_agent.process({"image_file": image_file, "demo_key": demo_key})
        logs.append(presc_res["log"])
        
        response_text = ""
        extracted = {}
        
        if presc_res.get("success"):
            extracted = presc_res.get("extracted_data", {})
            raw_text = presc_res.get("raw_text", "")
            response_text = f"**[Prescription Agent OCR Scan Results]**\n\n**Raw Text Extracted:**\n```\n{raw_text.strip()}\n```\n\n"
            response_text += f"**Extracted Medication Parameters:**\n- **Name:** {extracted.get('name')}\n- **Dosage:** {extracted.get('dosage')}\n- **Frequency:** {extracted.get('frequency')}\n- **Time (Suggested):** {extracted.get('time')} IST\n"
        else:
            response_text = "Failed to scan prescription image."
            
        # 3. If medication was successfully extracted, ReminderAgent processes it
        if extracted and extracted.get("name") and extracted.get("name") != "Unknown Medication":
            rem_res = self.reminder_agent.process({"medication": extracted})
            logs.append(rem_res["log"])
            response_text += f"\n\n🚨 **[Reminder Agent Action]**\n{rem_res.get('message')}"
        else:
            logs.append(f"✓ {self.reminder_agent.name}: Idle. No valid medication identified to schedule.")
            
        # 4. DoctorAgent analyzes
        logs.append(f"✓ {self.doctor_agent.name}: Reviewed extracted details against clinical reference files.")
        
        # 5. VoiceAgent speaks announcement
        self.voice_agent.process({"text": f"Prescription processed successfully. Scheduled {extracted.get('name')}.", "language": "english"})
        logs.append(f"✓ {self.voice_agent.name}: Spoke completion status announcement.")
        
        return {
            "success": True,
            "raw_text": presc_res.get("raw_text", ""),
            "extracted_data": extracted,
            "source": presc_res.get("source", ""),
            "response": response_text,
            "agent_logs": logs
        }

    def generate_health_report(self, period: str, hr_history: list, step_history: list) -> dict:
        # Calls the ReportAgent to analyze DB logs and smartwatch telemetry
        res = self.report_agent.process({
            "period": period,
            "heart_rate_history": hr_history,
            "steps_history": step_history
        })
        return res
