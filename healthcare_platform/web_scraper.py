"""
web_scraper.py - Fetches live emergency tips and first-aid instructions from DuckDuckGo HTML search.
Graceful fallbacks are built in to guarantee uptime if network request fails.
"""

import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import sys

# Reconfigure encoding for Windows if running standalone
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

def search_emergency_tips(query: str) -> str:
    """
    Queries DuckDuckGo HTML search for the medical/first aid concern.
    Parses and returns a summary of the top search results to inject into the AI context.
    """
    # Clean and augment the query to focus on first-aid/emergency medical guidance
    augmented_query = f"first aid emergency tips for {query}"
    encoded_query = urllib.parse.quote_plus(augmented_query)
    url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    print(f"[SCRAPER] Querying DuckDuckGo: '{augmented_query}'")
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            html = response.read()
            
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        
        # DuckDuckGo HTML results are contained in divs with class "result__body"
        for idx, result in enumerate(soup.find_all('div', class_='result__body')[:3]):
            title_elem = result.find('a', class_='result__a')
            snippet_elem = result.find('a', class_='result__snippet')
            
            title = title_elem.text.strip() if title_elem else "No Title"
            snippet = snippet_elem.text.strip() if snippet_elem else "No Snippet"
            
            results.append(f"Result {idx+1}: {title}\nSnippet: {snippet}\n")
            
        if results:
            print(f"[SCRAPER] Successfully scraped {len(results)} results.")
            return "\n".join(results)
        else:
            print("[SCRAPER WARNING] No search results found on DuckDuckGo HTML page.")
            return get_local_first_aid_fallback(query)
            
    except Exception as e:
        print(f"[SCRAPER ERROR] Web scraping failed: {e}. Using fallback reference library.")
        return get_local_first_aid_fallback(query)

def get_local_first_aid_fallback(query: str) -> str:
    """Provides local first-aid guidelines in case of network errors or rate limiting."""
    q = query.lower()
    if "heart" in q or "chest" in q:
        return "Local Clinic Tip: Call emergency services immediately. Sit patient down, loosen clothing, ask for nitroglycerin."
    elif "bleed" in q:
        return "Local Clinic Tip: Apply direct pressure using a clean cloth. Elevate wound above heart level."
    elif "breath" in q:
        return "Local Clinic Tip: Help patient sit upright. Assist with asthma rescue inhaler. Monitor breathing closely."
    elif "chok" in q:
        return "Local Clinic Tip: Perform Heimlich maneuver (abdominal thrusts) if conscious. If unconscious, call emergency services and begin CPR."
    return "Local Clinic Tip: Keep patient warm, still, and contact local health services immediately."

if __name__ == "__main__":
    # Test execution
    print(search_emergency_tips("heat stroke"))
