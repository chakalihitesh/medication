"""
voice.py - Text-to-Speech and Speech-to-Text helper (safe, non-blocking)
PyAudio is optional — gracefully degrades if not installed.
"""

import threading
import sys

# ---- TTS (Text-to-Speech) ----
_tts_engine = None
_tts_lock = threading.Lock()
_tts_available = False


def _init_tts():
    global _tts_engine, _tts_available
    try:
        import pyttsx3
        _tts_engine = pyttsx3.init()
        _tts_engine.setProperty('rate', 165)
        _tts_engine.setProperty('volume', 1.0)
        _tts_available = True
        print("[VOICE] pyttsx3 TTS engine initialized.")
    except Exception as e:
        print(f"[VOICE WARNING] TTS engine unavailable: {e}")
        _tts_available = False


# Initialize TTS once on module load
_init_tts()


def speak_text(text: str):
    """Speak the given text asynchronously using pyttsx3. Non-blocking."""
    if not _tts_available or not _tts_engine:
        print(f"[TTS SKIPPED] {text[:60]}...")
        return

    def _speak():
        with _tts_lock:
            try:
                clean = text.encode('ascii', errors='ignore').decode('ascii')
                _tts_engine.say(clean)
                _tts_engine.runAndWait()
            except Exception as e:
                print(f"[TTS ERROR] {e}")

    threading.Thread(target=_speak, daemon=True).start()


# ---- STT (Speech-to-Text) ----
_stt_available = False
_pyaudio_available = False


def _check_stt():
    global _stt_available, _pyaudio_available
    try:
        import speech_recognition as sr  # noqa
        _stt_available = True
        try:
            import pyaudio  # noqa
            _pyaudio_available = True
            print("[VOICE] SpeechRecognition + PyAudio available.")
        except ImportError:
            _pyaudio_available = False
            print(
                "[VOICE WARNING] PyAudio not found. "
                "To fix on Windows, run:\n"
                "  pip install pipwin\n"
                "  pipwin install pyaudio\n"
                "Voice input will be disabled until PyAudio is installed."
            )
    except ImportError:
        _stt_available = False
        print("[VOICE WARNING] SpeechRecognition not installed. Voice input disabled.")


_check_stt()


def listen_to_speech() -> dict:
    """
    Listens to microphone input and returns transcribed text.
    Returns: { success: bool, text: str | None, error: str | None }
    """
    if not _stt_available:
        return {
            "success": False,
            "text": None,
            "error": "SpeechRecognition library not installed. Run: pip install speechrecognition"
        }

    if not _pyaudio_available:
        return {
            "success": False,
            "text": None,
            "error": (
                "PyAudio is not installed. To fix on Windows:\n"
                "1. Run: pip install pipwin\n"
                "2. Then: pipwin install pyaudio\n"
                "Voice input disabled until PyAudio is installed."
            )
        }

    try:
        import speech_recognition as sr

        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            print("[STT] Listening...")
            audio = recognizer.listen(source, timeout=8, phrase_time_limit=15)

        text = recognizer.recognize_google(audio)
        print(f"[STT] Recognized: {text}")
        return {"success": True, "text": text, "error": None}

    except Exception as e:
        err_msg = str(e)
        print(f"[STT ERROR] {err_msg}")
        return {"success": False, "text": None, "error": f"Voice recognition failed: {err_msg}"}
