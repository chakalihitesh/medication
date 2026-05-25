import os
import re
import random
import numpy as np
try:
    from sklearn.cluster import KMeans
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Import Gemini API library
import google.generativeai as genai

# Setup Gemini API key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Define allowed specialties
SPECIALTIES = [
    "Emergency",
    "Cardiology",
    "Neurology",
    "Orthopedic",
    "Pediatrics",
    "General Hospital"
]

def cluster_hospitals(hospitals: list) -> list:
    """
    Groups nearby hospitals using Scikit-learn KMeans clustering.
    Adds a 'cluster_id' (int) key to each hospital dictionary.
    """
    if not hospitals:
        return []
    
    # Extract coordinates
    coords = []
    valid_indices = []
    for idx, h in enumerate(hospitals):
        lat = h.get("lat") or h.get("latitude")
        lng = h.get("lng") or h.get("longitude")
        if lat is not None and lng is not None:
            coords.append([float(lat), float(lng)])
            valid_indices.append(idx)
        else:
            h["cluster_id"] = 0  # Default if no coords
            
    if len(coords) == 0:
        return hospitals

    # Determine number of clusters
    n_points = len(coords)
    if n_points < 3 or not SKLEARN_AVAILABLE:
        # Simple coordinate-based heuristic grouping if sklearn is missing or too few points
        for i, idx in enumerate(valid_indices):
            hospitals[idx]["cluster_id"] = i % 3
    else:
        try:
            n_clusters = min(4, n_points)
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(coords)
            for i, idx in enumerate(valid_indices):
                hospitals[idx]["cluster_id"] = int(labels[i])
        except Exception as e:
            print(f"[Clustering Error] {e}")
            for i, idx in enumerate(valid_indices):
                hospitals[idx]["cluster_id"] = i % 3
                
    return hospitals

def classify_hospital_heuristics(name: str, rating: float, reviews: list, status: str = "OPERATIONAL") -> dict:
    """
    NLP heuristic classifier fallback when Gemini API is unavailable.
    """
    reviews_text = " ".join(reviews).lower()
    combined_text = f"{name} {reviews_text}".lower()
    
    # 1. Determine specialty
    specialty = "General Hospital"
    if any(k in combined_text for k in ["heart", "cardio", "ecg", "valve", "cardiac", "chest pain"]):
        specialty = "Cardiology"
    elif any(k in combined_text for k in ["brain", "neuro", "spine", "stroke", "nerve", "headache"]):
        specialty = "Neurology"
    elif any(k in combined_text for k in ["ortho", "bone", "joint", "fracture", "knee", "spine"]):
        specialty = "Orthopedic"
    elif any(k in combined_text for k in ["pediatric", "child", "baby", "kid", "neonatal", "infant"]):
        specialty = "Pediatrics"
    elif any(k in combined_text for k in ["emergency", "trauma", "er", "accident", "ambulance", "icu"]):
        specialty = "Emergency"
        
    # 2. Determine Emergency Support
    emergency_support = False
    if any(k in combined_text for k in ["emergency", "trauma", "er", "accident", "24/7", "24 hours", "icu", "ambulance"]):
        emergency_support = True
        
    # 3. Determine Crowd Level
    crowd_level = "Medium"
    high_crowd_keywords = ["crowded", "busy", "long lines", "waiting", "queue", "packed", "slow"]
    low_crowd_keywords = ["quick", "no wait", "fast", "empty", "rapid", "immediate"]
    
    high_count = sum(1 for k in high_crowd_keywords if k in reviews_text)
    low_count = sum(1 for k in low_crowd_keywords if k in reviews_text)
    
    if high_count > low_count:
        crowd_level = "High"
    elif low_count > high_count or (not high_count and rating > 4.5):
        crowd_level = "Low"
        
    # 4. Recommendation Score
    base_score = int((rating if rating != "N/A" and rating else 4.0) * 15)  # Max 75
    if emergency_support:
        base_score += 15
    if crowd_level == "Low":
        base_score += 10
    elif crowd_level == "Medium":
        base_score += 5
        
    recommendation_score = min(100, max(40, base_score))
    
    return {
        "specialty": specialty,
        "emergency_support": emergency_support,
        "crowd_level": crowd_level,
        "recommendation_score": recommendation_score
    }

def classify_hospital_with_ai(name: str, rating: float, reviews: list, status: str = "OPERATIONAL") -> dict:
    """
    Classifies a hospital using Gemini NLP review analysis. Falls back to heuristics if needed.
    """
    if not GEMINI_API_KEY:
        return classify_hospital_heuristics(name, rating, reviews, status)
        
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Analyze the following healthcare facility and its patient reviews:
        Facility Name: {name}
        Rating: {rating}
        Reviews: {reviews}
        
        Classify this facility into one of these specialties: {', '.join(SPECIALTIES)}.
        Determine if it has 24/7 Emergency Support (True/False).
        Determine the current Crowd Level (Low, Medium, High).
        Calculate an overall Recommendation Score (0 to 100) based on ratings, reviews sentiment, and capabilities.
        
        Return ONLY a raw JSON response (no markdown formatting, no ```json, no extra text) with these exact keys:
        {{
            "specialty": "string",
            "emergency_support": boolean,
            "crowd_level": "string",
            "recommendation_score": number
        }}
        """
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean up any potential markdown wraps
        text = re.sub(r"^```json\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"```$", "", text, flags=re.MULTILINE)
        
        import json
        data = json.loads(text.strip())
        
        # Ensure values are clean
        if data.get("specialty") not in SPECIALTIES:
            data["specialty"] = "General Hospital"
        if data.get("crowd_level") not in ["Low", "Medium", "High"]:
            data["crowd_level"] = "Medium"
        data["recommendation_score"] = int(data.get("recommendation_score", 70))
        data["emergency_support"] = bool(data.get("emergency_support", False))
        
        return data
    except Exception as e:
        print(f"[Gemini Classification Fail] {e}. Falling back to heuristics.")
        return classify_hospital_heuristics(name, rating, reviews, status)

def calculate_recommendation(lat: float, lng: float, specialty: str, hospitals: list) -> list:
    """
    Scores and ranks hospitals based on:
    - Specialty match
    - Distance (closer = higher)
    - Rating
    - Emergency support
    - Crowd level
    Adds 'score' (int) and 'reason' (str) to each hospital.
    Returns the sorted list (highest score first).
    """
    scored_hospitals = []
    
    for h in hospitals:
        # Get or compute AI classification
        ai_data = h.get("ai_classification")
        if not ai_data:
            # Parse coordinates, rating and reviews to classify
            rating_val = h.get("rating")
            try:
                rating = float(rating_val) if rating_val and rating_val != "N/A" else 4.0
            except ValueError:
                rating = 4.0
                
            reviews = h.get("reviews", ["Excellent doctors", "Operational center"])
            ai_data = classify_hospital_heuristics(h["name"], rating, reviews)
            h["ai_classification"] = ai_data
            
        # Calculate recommendation score
        score = ai_data["recommendation_score"]
        
        # 1. Specialty match bonus
        is_match = ai_data["specialty"].lower() == specialty.lower()
        if is_match:
            score += 25
            
        # 2. Distance penalty/bonus
        dist_str = h.get("distance", "")
        dist_km = 5.0  # Default fallback
        if dist_str:
            try:
                dist_km = float(re.sub(r'[^\d\.]', '', dist_str))
            except ValueError:
                pass
                
        # Closer gives up to 15 bonus points
        dist_bonus = max(0, int((10 - dist_km) * 1.5))
        score += dist_bonus
        
        # 3. Emergency bonus if looking for Emergency/Cardiology
        if specialty.lower() in ["emergency", "cardiology"] and ai_data["emergency_support"]:
            score += 15
            
        # 4. Crowd level adjustment
        if ai_data["crowd_level"] == "Low":
            score += 5
        elif ai_data["crowd_level"] == "High":
            score -= 10
            
        # Cap score between 0 and 100
        final_score = min(100, max(20, score))
        h["recommendation_score"] = final_score
        
        # Generate clean, premium reasoning
        reasons = []
        if is_match:
            reasons.append(f"matches your requested {specialty} specialty")
        else:
            reasons.append(f"offers {ai_data['specialty']} care")
            
        reasons.append(f"is located only {dist_km:.1f} km away")
        
        if ai_data["emergency_support"]:
            reasons.append("provides 24/7 emergency support")
            
        if ai_data["crowd_level"] == "Low":
            reasons.append("has a low patient crowd level right now")
        elif ai_data["crowd_level"] == "High":
            reasons.append("is currently busy/crowded")
            
        reason_text = f"{h['name']} {', '.join(reasons[:-1])}, and {reasons[-1]}."
        h["recommendation_reason"] = reason_text
        
        scored_hospitals.append(h)
        
    # Sort by score descending
    scored_hospitals.sort(key=lambda x: x["recommendation_score"], reverse=True)
    return scored_hospitals
