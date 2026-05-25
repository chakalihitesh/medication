import os
import google.generativeai as genai
from dotenv import load_dotenv
from knowledge_base import kb_instance
from emergency import check_emergency, get_google_maps_link
import database

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini API key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("[CHATBOT WARNING] GEMINI_API_KEY environment variable not found. Chatbot will run in mock simulation mode.")

# Medical Disclaimer appended to medical advice responses
MEDICAL_DISCLAIMER = "\n\n*Disclaimer: I am an AI healthcare assistant, not a licensed medical professional. Please seek immediate clinical care if you are experiencing severe symptoms or require formal diagnosis.*"

SYSTEM_PROMPT = """
You are "HealthMate AI", a friendly, highly intelligent, and empathetic healthcare assistant.
Your goal is to guide users on general health, wellness, diet, and medications using verified reference knowledge.

Instructions:
1. Be concise, professional, warm, and clear.
2. If context is provided in the prompt from our verified local reference library, prioritize using that context to answer. State that you are using reference clinic files if appropriate.
3. Keep answers factual. If you do not know the answer or if it's outside the provided reference files, use general medical knowledge but explicitly remind the user to consult their physician.
4. Always emphasize safety.
5. If the user indicates a severe medical emergency (such as severe chest pain, major bleeding, choking, or inability to breathe), immediately instruct them to stop chatting and call emergency services (911 / 112 / 102).
"""

def generate_ai_response(user_message, chat_history=[], language="english", user_email=None):
    """
    Sends the user message to Gemini API, including chat history for multi-turn context
    and injecting RAG reference context from local files.
    """
    lang = (language or "english").lower()
    
    # Localized disclaimers
    disclaimers = {
        "english": "\n\n*Disclaimer: I am just an AI Doctor Agent.*",
        "hindi": "\n\n*अस्वीकरण: मैं केवल एक एआई डॉक्टर एजेंट हूं।*",
        "telugu": "\n\n*నిరాకరణ: నేను కేవలం ఒక AI డాక్టర్ ఏజెంట్‌ను మాత్రమే.*"
    }
    current_disclaimer = disclaimers.get(lang, disclaimers["english"])

    # 1. Check for emergency keywords immediately (failsafe safety module)
    emergency_check = check_emergency(user_message, language=lang)
    if emergency_check["is_emergency"]:
        # If it's a life-threatening emergency, return direct first aid info and bypass Gemini
        alert_titles = {
            "english": "EMERGENCY ALERT TRIGGERED!",
            "hindi": "आपातकालीन चेतावनी सक्रिय की गई!",
            "telugu": "అत्यవసర హెచ్చరిక సక్రియం చేయబడింది!"
        }
        maps_texts = {
            "english": "Please click here to find the nearest hospital:",
            "hindi": "कृपया निकटतम अस्पताल खोजने के लिए यहां क्लिक करें:",
            "telugu": "దయచేసి సమీపంలోని ఆసుపత్రిని కనుగొనడానికి ఇక్కడ క్లిక్ చేయండి:"
        }
        alert_title = alert_titles.get(lang, alert_titles["english"])
        maps_text = maps_texts.get(lang, maps_texts["english"])
        
        db_response = f"{alert_title}\n\n{emergency_check['guide']}\n\n{maps_text} {get_google_maps_link()}"
        database.save_chat_message("user", user_message, user_email=user_email)
        database.save_chat_message("assistant", db_response, user_email=user_email)
        return {
            "text": db_response,
            "is_emergency": True,
            "hospitals": emergency_check["hospitals"]
        }

    # 2. Retrieve local knowledge repository context (RAG)
    rag_context = kb_instance.get_rag_context(user_message)
    
    # 3. Save User message to Database history
    database.save_chat_message("user", user_message, user_email=user_email)

    # 4. If Gemini API key is missing, return a helpful mock response
    if not api_key:
        mock_response = simulate_mock_response(user_message, rag_context, lang)
        database.save_chat_message("assistant", mock_response, user_email=user_email)
        return {
            "text": mock_response,
            "is_emergency": False,
            "hospitals": []
        }

    # 5. Format prompt with RAG context and system guidelines
    full_prompt = f"{SYSTEM_PROMPT}\n\n[LOCAL REFERENCE KNOWLEDGE]\n{rag_context}\n\n[USER INQUIRY]\n{user_message}"

    try:
        # Load the Gemini Model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare history for Gemini's conversational style
        gemini_history = []
        for msg in chat_history[-10:]: # Keep last 10 turns to save token usage
            role = "user" if msg["role"] == "user" else "model"
            # Strip any disclaimer from past messages to prevent history inflation
            content = msg["message"]
            for d_val in disclaimers.values():
                content = content.replace(d_val, "")
            gemini_history.append({"role": role, "parts": [content]})
            
        # Start a multi-turn chat session with history
        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(full_prompt)
        
        # Strip AI's generated disclaimer if it duplicate-appended it
        clean_response = response.text.strip()
        for d_val in disclaimers.values():
            clean_response = clean_response.replace(d_val.strip(), "")
        clean_response = clean_response.strip()

        # Append medical disclaimer to the chatbot response
        assistant_text = clean_response + current_disclaimer
        
        # Save assistant message to Database history
        database.save_chat_message("assistant", assistant_text, user_email=user_email)
        
        return {
            "text": assistant_text,
            "is_emergency": False,
            "hospitals": []
        }
        
    except Exception as e:
        print(f"[CHATBOT ERROR] Gemini API call failed: {e}")
        # Build a structured error fallback
        if lang == "hindi":
            error_fallback = (
                "**मददगार सुझाव (Tips):** क्षमा करें, एआई सर्वर में समस्या है। कृपया बाद में प्रयास करें।\n"
                "**दवा (Medicine):** कोई नहीं\n"
                "**मात्रा (Quantity):** कोई नहीं\n"
                "**समय (Timing):** कोई नहीं"
                f"{current_disclaimer}"
            )
        elif lang == "telugu":
            error_fallback = (
                "**చిట్కాలు (Tips):** క్షమించండి, AI సర్వర్‌తో కనెక్షన్ వైఫల్యం జరిగింది.\n"
                "**మందులు (Medicine):** ఏమీ లేదు\n"
                "**మోతాదు (Quantity):** ఏమీ లేదు\n"
                "**సమయం (Timing):** ఏమీ లేదు"
                f"{current_disclaimer}"
            )
        else:
            error_fallback = (
                "**Tips:** Apologies, connection to the AI center failed. Please verify the server is running.\n"
                "**Medicine:** None\n"
                "**Quantity:** None\n"
                "**Timing:** None"
                f"{current_disclaimer}"
            )
        database.save_chat_message("assistant", error_fallback, user_email=user_email)
        return {
            "text": error_fallback,
            "is_emergency": False,
            "hospitals": []
        }

def simulate_mock_response(query, context, language="english"):
    """Fallback generator providing smart responses when no Gemini API key is configured."""
    lang = (language or "english").lower()
    cleaned = query.lower()
    
    # Check context
    has_kb = "No local repository files matched" not in context
    kb_details = f"Based on clinic files: {context}" if has_kb else ""
    
    if lang == "hindi":
        disclaimer = "\n\n*अस्वीकरण: मैं केवल एक एआई डॉक्टर एजेंट हूं।*"
        if any(w in cleaned for w in ["diet", "eat", "food", "आहार", "भोजन", "खाना"]):
            tips = "संतुलित आहार लें (ताजी सब्जियां, साबुत अनाज)। चीनी और संतृप्त वसा से बचें।"
        elif any(w in cleaned for w in ["sleep", "नींद", "सोना"]):
            tips = "सोने का नियमित समय बनाए रखें। प्रति रात 7-9 घंटे की नींद लें।"
        elif any(w in cleaned for w in ["headache", "fever", "pain", "दर्द", "सिर", "बुखार", "तापमान"]):
            tips = "भरपूर पानी पिएं, अंधेरे कमरे में आराम करें। यदि आपको बुखार है, तो शरीर के तापमान की निगरानी करें और आराम करें।"
        else:
            tips = "स्वस्थ जीवन शैली बनाए रखें। दैनिक 30 मिनट व्यायाम करें, पर्याप्त पानी पीएं और संतुलित भोजन लें।"
            
        return (
            f"**मददगार सुझाव (Tips):** {tips}\n"
            f"**दवा (Medicine):** कोई नहीं\n"
            f"**मात्रा (Quantity):** कोई नहीं\n"
            f"**समय (Timing):** कोई नहीं"
            f"{disclaimer}"
        )
    elif lang == "telugu":
        disclaimer = "\n\n*నిరాకరణ: నేను కేవలం ఒక AI డాక్టర్ ఏజెంట్‌ను మాత్రమే.*"
        if any(w in cleaned for w in ["diet", "eat", "food", "ఆహారం", "భోజనం", "తిండి"]):
            tips = "సమతుల్య ఆహారం తీసుకోండి (తాజా కూరగాయలు, తృణధాన్యాలు). చక్కెర మరియు కొవ్వు పదార్థాలను నివారించండి."
        elif any(w in cleaned for w in ["sleep", "నిద్ర"]):
            tips = "నిద్ర వేళలను స్థిరంగా ఉంచుకోండి. రాత్రికి 7-9 గంటలు నిద్రపోండి."
        elif any(w in cleaned for w in ["headache", "fever", "pain", "నొప్పి", "తలనొప్పి", "జ్వరం"]):
            tips = "సమృద్ధిగా నీరు త్రాగాలి, ప్రశాంతంగా విశ్రాంతి తీసుకోండి. జ్వరం తీవ్రతను పర్యవేక్షించండి."
        else:
            tips = "ఆరోగ్యకరమైన జీవనశైలిని పాటించండి. ప్రతిరోజూ 30 నిమిషాలు వ్యాయామం చేయండి మరియు పుష్కలంగా నీరు త్రాగండి."
            
        return (
            f"**చిట్కాలు (Tips):** {tips}\n"
            f"**మందులు (Medicine):** ఏమీ లేదు\n"
            f"**మోతాదు (Quantity):** ఏమీ లేదు\n"
            f"**సమయం (Timing):** ఏమీ లేదు"
            f"{disclaimer}"
        )
    else:
        # English
        disclaimer = "\n\n*Disclaimer: I am just an AI Doctor Agent.*"
        if any(w in cleaned for w in ["diet", "eat", "food"]):
            tips = "Focus on eating fresh vegetables, lean proteins, and whole grains. Avoid sugars and saturated fats."
        elif any(w in cleaned for w in ["sleep"]):
            tips = "Maintain a consistent sleep schedule and aim for 7-9 hours per night."
        else:
            tips = kb_details if has_kb else "Maintain a healthy diet, exercise 30 minutes daily, and consult a physician for specific symptoms."
            
        return (
            f"**Tips:** {tips}\n"
            f"**Medicine:** None\n"
            f"**Quantity:** None\n"
            f"**Timing:** None"
            f"{disclaimer}"
        )
