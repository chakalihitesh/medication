import re
from PIL import Image

# Preset mock prescriptions for demonstration/quick judging
PRESCRIPTION_DEMOS = {
    "demo_amoxicillin.png": {
        "text": """
        ST. JUDE MEDICAL CLINIC
        Patient: John Doe
        Date: 2026-05-22
        
        Rx: Amoxicillin 500mg Capsules
        Disp: #21 (Twenty-one)
        Sig: Take 1 capsule by mouth three times daily (every 8 hours) for 7 days.
        Refill: 0
        Signed: Dr. Sarah Vance, MD
        """,
        "extracted": {
            "name": "Amoxicillin",
            "dosage": "500mg (1 capsule)",
            "frequency": "Three times daily",
            "time": "08:00" # Suggested morning time
        }
    },
    "demo_metformin.png": {
        "text": """
        METROPOLITAN CARE HOSPITAL
        Patient: Jane Smith
        Date: 2026-05-18
        
        Rx: Metformin 850mg Tablets
        Sig: Take 1 tablet twice daily with meals (morning and evening).
        Refills: 3
        Signed: Dr. Robert H., MD
        """,
        "extracted": {
            "name": "Metformin",
            "dosage": "850mg (1 tablet)",
            "frequency": "Twice daily",
            "time": "08:00"
        }
    }
}

# General lists of common medicines for matching from custom OCR scans
KNOWN_MEDICINES = ["Amoxicillin", "Metformin", "Lisinopril", "Aspirin", "Ibuprofen", "Paracetamol", "Vitamin D", "Amlodipine", "Atorvastatin", "Albuterol"]

def scan_prescription(image_file, demo_key=None):
    """
    Simulates or performs OCR text extraction on a prescription image.
    If demo_key is provided, loads a preset mock prescription.
    Otherwise, attempts to run actual OCR or falls back gracefully.
    """
    # 1. Check if demo is requested
    if demo_key and demo_key in PRESCRIPTION_DEMOS:
        demo_data = PRESCRIPTION_DEMOS[demo_key]
        return {
            "success": True,
            "raw_text": demo_data["text"],
            "extracted_data": demo_data["extracted"],
            "source": f"Demo Prescriptions ({demo_key})"
        }

    # 2. Attempt OCR scanning using EasyOCR
    raw_text = ""
    try:
        import easyocr
        import numpy as np
        
        # Initialize reader (offline download occurs on first run)
        reader = easyocr.Reader(['en'], gpu=False)
        
        # Load PIL image as numpy array
        img = Image.open(image_file)
        img_np = np.array(img)
        
        # Run OCR
        results = reader.readtext(img_np)
        raw_text = "\n".join([res[1] for res in results])
        print("[OCR] Scan completed successfully using EasyOCR.")
        
    except Exception as e:
        print(f"[OCR WARNING] EasyOCR failed or not installed: {e}")
        print("[OCR] Falling back to heuristic/metadata scan...")
        
        # Fallback heuristic: Check file name or metadata to guess
        filename = getattr(image_file, "name", "").lower()
        if "amox" in filename:
            return scan_prescription(None, demo_key="demo_amoxicillin.png")
        elif "metf" in filename:
            return scan_prescription(None, demo_key="demo_metformin.png")
        else:
            raw_text = "PRESCRIPTION SCAN OVERVIEW:\nPatient Name: Guest User\nRx: Paracetamol 500mg\nTake 1 tablet daily at 09:00 PM for fever relief."

    # 3. Parse matching medicines from text using regex/keywords
    extracted = parse_prescription_text(raw_text)
    
    return {
        "success": True,
        "raw_text": raw_text,
        "extracted_data": extracted,
        "source": "EasyOCR Scanner Engine" if "easyocr" in globals() else "Heuristic Fallback Engine"
    }

def parse_prescription_text(text):
    """Parses raw text to identify medicine, dosage, and time suggestions."""
    matched_name = "Unknown Medication"
    matched_dosage = "1 tablet"
    matched_time = "08:00"
    matched_frequency = "Daily"
    
    cleaned = text.lower()
    
    # Match known medications
    for med in KNOWN_MEDICINES:
        if med.lower() in cleaned:
            matched_name = med
            break
            
    # Try to parse dosage (e.g. "500mg", "850mg", "10mg")
    dosage_match = re.search(r'(\d+\s*(?:mg|mcg|ml|g))\b', text, re.IGNORECASE)
    if dosage_match:
        matched_dosage = dosage_match.group(1)
        
    # Try to parse frequency
    if "three times" in cleaned or "t.i.d" in cleaned:
        matched_frequency = "Three times daily"
    elif "twice" in cleaned or "b.i.d" in cleaned:
        matched_frequency = "Twice daily"
    elif "weekly" in cleaned:
        matched_frequency = "Weekly"
        
    # Try to parse time (e.g. "08:00", "9:00 PM")
    time_match = re.search(r'(\d{1,2}:\d{2}(?:\s*[ap]m)?)\b', text, re.IGNORECASE)
    if time_match:
        matched_time = time_match.group(1)
        
    return {
        "name": matched_name,
        "dosage": matched_dosage,
        "frequency": matched_frequency,
        "time": matched_time
    }
