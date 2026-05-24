import re

# Red-flag emergency symptoms keywords to scan for (supports English, Hindi, and Telugu)
EMERGENCY_KEYWORDS = [
    # English
    r"\bchest\s*pain\b", 
    r"\bpressure\s*in\s*chest\b",
    r"\bbreathing\s*issue\b", 
    r"\bshortness\s*of\s*breath\b",
    r"\bdifficulty\s*breathing\b",
    r"\bunconscious\b", 
    r"\bloss\s*of\s*consciousness\b", 
    r"\bpassed\s*out\b",
    r"\bsevere\s*bleeding\b",
    r"\bhemorrhage\b",
    r"\bchoking\b",
    r"\bheart\s*attack\b",
    r"\bstroke\b",
    r"\banaphylaxis\b",
    r"\ballergic\s*shock\b",
    # Hindi
    r"सीने\s*में\s*दर्द",
    r"छाती\s*में\s*दर्द",
    r"दिल\s*का\s*दौरा",
    r"सांस\s*की\s*तकलीफ",
    r"सांस\s*लेने\s*में\s*कठिनाई",
    r"बेहोश",
    r"बेहोशी",
    r"गंभीर\s*रक्तस्राव",
    r"खून\s*बहना",
    r"दम\s*घुटने",
    # Telugu
    r"ఛాతీ\s*నొప్పి",
    r"గుండెపోటు",
    r"శ్వాస\s*తీసుకోవడంలో\s*ఇబ్బంది",
    r"శ్వాస\s*సమస్య",
    r"స్పృహ\s*తప్పిపోవడం",
    r"స్పృహ\s*కోల్పోవడం",
    r"తీవ్రమైన\s*రక్తస్రావం",
    r"రక్తం\s*కారడం"
]

# Emergency instructions translated into English, Hindi, and Telugu
FIRST_AID_GUIDES = {
    "english": {
        "chest_pain": """
🚨 **HEART ATTACK / CHEST PAIN PROTOCOL:**
1. **Call Emergency Services (911 / 112 / 102) immediately.**
2. Have the person sit down, rest, and try to remain calm.
3. Loosen any tight clothing.
4. Ask if they take nitroglycerin or heart medication, and assist them in taking it.
5. If unconscious, prepare to perform CPR.
        """,
        "breathing_issue": """
🚨 **RESPIRATORY EMERGENCY PROTOCOL:**
1. **Call Emergency Services (911 / 112 / 102) immediately.**
2. Help the person sit upright. Encourage slow, deep breaths.
3. Assist them with their rescue inhaler (bronchodilator) if they have asthma.
4. Do not give them anything to eat or drink.
5. Monitor airway; if they stop breathing, begin CPR.
        """,
        "unconscious": """
🚨 **UNCONSCIOUSNESS PROTOCOL:**
1. **Call Emergency Services (911 / 112 / 102) immediately.**
2. Check for breathing and a pulse.
3. If breathing, place the person in the **Recovery Position** (on their side, head tilted back slightly).
4. Do not leave the person unattended.
5. If no breathing or pulse is detected, begin CPR immediately.
        """,
        "severe_bleeding": """
🚨 **SEVERE BLEEDING PROTOCOL:**
1. **Call Emergency Services (911 / 112 / 102) immediately.**
2. Put on gloves if available. Apply firm, direct pressure on the wound with a clean cloth.
3. Elevate the injured limb above heart level if possible.
4. Do not remove the cloth if it becomes soaked; add more cloths on top and continue pressing.
5. If bleeding does not stop, apply pressure to arterial pressure points or use a tourniquet.
        """,
        "general": """
🚨 **GENERAL LIFE-THREATENING EMERGENCY:**
1. **Call Emergency Services (911 / 112 / 102) immediately.**
2. Stay calm and stay on the line with dispatchers.
3. Keep the patient warm and still.
4. Follow all dispatcher instructions until paramedics arrive.
        """
    },
    "hindi": {
        "chest_pain": """
🚨 **हार्ट अटैक / सीने में दर्द प्रोटोकॉल:**
1. **आपातकालीन सेवाओं (102 / 112) को तुरंत कॉल करें।**
2. व्यक्ति को बैठाएं, आराम करने दें और शांत रहने की कोशिश करें।
3. तंग कपड़े ढीले करें।
4. पूछें कि क्या वे नाइट्रोग्लिसरीन या दिल की दवा लेते हैं, और उन्हें लेने में मदद करें।
5. यदि बेहोश हैं, तो सीपीआर (CPR) करने के लिए तैयार रहें।
        """,
        "breathing_issue": """
🚨 **श्वसन आपातकालीन प्रोटोकॉल:**
1. **आपातकालीन सेवाओं (102 / 112) को तुरंत कॉल करें।**
2. व्यक्ति को सीधे बैठने में मदद करें। धीमी, गहरी सांस लेने के लिए प्रोत्साहित करें।
3. यदि उन्हें अस्थमा है तो उनके इनहेलर से उनकी मदद करें।
4. उन्हें खाने या पीने के लिए कुछ न दें।
5. वायुमार्ग की निगरानी करें; यदि वे सांस लेना बंद कर दें, तो सीपीआर (CPR) शुरू करें।
        """,
        "unconscious": """
🚨 **बेहोशी प्रोटोकॉल:**
1. **आपातकालीन सेवाओं (102 / 112) को तुरंत कॉल करें।**
2. सांस और नाड़ी की जांच करें।
3. यदि सांस ले रहे हैं, तो व्यक्ति को **रिकवरी पोजीशन** (करवट पर, सिर थोड़ा पीछे झुका हुआ) में रखें।
4. व्यक्ति को अकेला न छोड़ें।
5. यदि कोई सांस या नाड़ी नहीं पाई जाती है, तो तुरंत सीपीआर (CPR) शुरू करें।
        """,
        "severe_bleeding": """
🚨 **गंभीर रक्तस्राव प्रोटोकॉल:**
1. **आपातकालीन सेवाओं (102 / 112) को तुरंत कॉल करें।**
2. घाव पर साफ कपड़े से सीधा दबाव डालें।
3. यदि संभव हो तो घायल हिस्से को दिल के स्तर से ऊपर उठाएं।
4. कपड़ा भीगने पर भी उसे न हटाएं; ऊपर से और कपड़े रखें और दबाना जारी रखें।
5. यदि रक्तस्राव नहीं रुकता है, तो दबाव बिंदुओं पर दबाव डालें।
        """,
        "general": """
🚨 **सामान्य जीवन-खतरे की आपात स्थिति:**
1. **आपातकालीन सेवाओं (102 / 112) को तुरंत कॉल करें।**
2. शांत रहें और डिस्पैचर के साथ लाइन पर बने रहें।
3. मरीज को गर्म और स्थिर रखें।
4. पैरामेडिक्स के आने तक सभी निर्देशों का पालन करें।
        """
    },
    "telugu": {
        "chest_pain": """
🚨 **గుండెపోటు / ఛాతీ నొప్పి ప్రోటోకాల్:**
1. **వెంటనే అత్యవసర సేవలకు (102 / 112) కాల్ చేయండి.**
2. ఆ వ్యక్తిని కూర్చోబెట్టి, విశ్రాంతి తీసుకోమని మరియు ప్రశాంతంగా ఉండటానికి ప్రయత్నించమని చెప్పండి.
3. గట్టి దుస్తులను సడలించండి.
4. వారు నైట్రోగ్లిజరిన్ లేదా గుండె మందులు తీసుకుంటారా అని అడిగి, దానిని తీసుకోవడంలో సహాయపడండి.
5. స్పృహ తప్పిపోతే, CPR చేయడానికి సిద్ధంగా ఉండండి.
        """,
        "breathing_issue": """
🚨 **శ్వాసకోశ అత్యవసర ప్రోటోకాల్:**
1. **వెంటనే అత్యవసర సేవలకు (102 / 112) కాల్ చేయండి.**
2. ఆ వ్యక్తిని నిటారుగా కూర్చోబెట్టండి. నిదానంగా, లోతుగా శ్వాస తీసుకోవడాన్ని ప్రోత్సహించండి.
3. వారికి ఉబ్బసం ఉంటే వారి రెస్క్యూ ఇన్హేలర్ ఉపయోగించడానికి సహాయం చేయండి.
4. వారికి తినడానికి లేదా తాగడానికి ఏమీ ఇవ్వకండి.
5. శ్వాస నిలిచిపోతే, వెంటనే CPR ప్రారంభించండి.
        """,
        "unconscious": """
🚨 **స్పృహ తప్పడం ప్రోటోకాల్:**
1. **వెంటనే అత్యవసర సేవలకు (102 / 112) కాల్ చేయండి.**
2. శ్వాస మరియు నాడి తనిఖీ చేయండి.
3. శ్వాస తీసుకుంటే, వ్యక్తిని **రికవరీ పొజిషన్** (ప్రక్కకు తిప్పి, తల కొద్దిగా వెనుకకు వంచడం) లో ఉంచండి.
4. ఆ వ్యక్తిని ఒంటరిగా వదిలివేయవద్దు.
5. శ్వాస లేదా నాడి కనుగొనబడకపోతే, వెంటనే CPR ప్రారంభించండి.
        """,
        "severe_bleeding": """
🚨 **తీవ్రమైన రక్తస్రావం ప్రోటోకాల్:**
1. **వెంటనే అత్యవసర సేవలకు (102 / 112) కాల్ చేయండి.**
2. శుభ్రమైన గుడ్డతో గాయంపై నేరుగా గట్టిగా ఒత్తిడి చేయండి.
3. వీలైతే గాయపడిన అవయవాన్ని గుండె స్థాయి కంటే పైకి లేపండి.
4. గుడ్డ తడిసిపోయినా తీయకండి; దానిపై మరికొన్ని బట్టలు ఉంచి నొక్కడం కొనసాగించండి.
5. రక్తస్రావం ఆగకపోతే, ప్రెజర్ పాయింట్లపై ఒత్తిడి చేయండి.
        """,
        "general": """
🚨 **సాధారణ అత్యవసర పరిస్థితి:**
1. **వెంటనే అత్యవసర సేవలకు (102 / 112) కాల్ చేయండి.**
2. ప్రశాంతంగా ఉండండి మరియు లైన్ లోనే ఉండండి.
3. రోగిని వెచ్చగా మరియు కదలకుండా ఉంచండి.
4. పారామెడిక్స్ వచ్చే వరకు సూచనలన్నింటినీ పాటించండి.
        """
    }
}

MOCK_HOSPITALS = [
    {"name": "St. Mary's General Hospital", "distance": "1.2 miles", "phone": "+1-555-0199", "address": "456 Health Boulevard"},
    {"name": "City Emergency Trauma Center", "distance": "2.8 miles", "phone": "+1-555-0188", "address": "789 Care Avenue"},
    {"name": "Grace Memorial Clinic", "distance": "4.1 miles", "phone": "+1-555-0177", "address": "12 Wellness Drive"}
]

def check_emergency(user_text, language="english"):
    """
    Scans input text for any emergency-related keywords.
    Returns a dictionary with is_emergency, symptom type, and first-aid guide.
    """
    cleaned_text = user_text.lower()
    lang = (language or "english").lower()
    if lang not in ["english", "hindi", "telugu"]:
        lang = "english"
    
    for kw_pattern in EMERGENCY_KEYWORDS:
        if re.search(kw_pattern, cleaned_text):
            # Identify which protocol to load
            symptom = "general"
            if any(term in cleaned_text for term in ["chest", "heart", "सीने", "छाती", "दिल", "ఛాతీ", "గుండెపోటు"]):
                symptom = "chest_pain"
            elif any(term in cleaned_text for term in ["breath", "respir", "सांस", "శ్వాస"]):
                symptom = "breathing_issue"
            elif any(term in cleaned_text for term in ["unconscious", "pass", "बेहोश", "बेहोशी", "స్పృహ"]):
                symptom = "unconscious"
            elif any(term in cleaned_text for term in ["bleed", "hemorrhage", "रक्तस्राव", "खून", "రక్తం", "రక్తస్రావం"]):
                symptom = "severe_bleeding"
                
            return {
                "is_emergency": True,
                "symptom": symptom,
                "guide": FIRST_AID_GUIDES[lang][symptom],
                "hospitals": MOCK_HOSPITALS
            }
            
    return {
        "is_emergency": False,
        "symptom": None,
        "guide": None,
        "hospitals": []
    }

def get_google_maps_link():
    """Generates a search link for nearby hospitals on Google Maps."""
    return "https://www.google.com/maps/search/hospitals+near+me/"
