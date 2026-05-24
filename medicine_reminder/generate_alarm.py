import wave
import math
import struct
import os

def create_alarm_sound(file_path):
    sample_rate = 44100.0
    duration = 2.0  # 2 seconds
    freq = 880.0  # 880Hz tone (clear alarm beep)
    
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with wave.open(file_path, "w") as wav_file:
        wav_file.setnchannels(1)  # mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(int(sample_rate))
        
        num_samples = int(duration * sample_rate)
        for i in range(num_samples):
            # Beep cycle of 0.5s: 0.3s beep, 0.2s silence
            t = i / sample_rate
            cycle_t = t % 0.5
            
            if cycle_t < 0.3:
                # generate sine wave
                val = math.sin(2.0 * math.pi * freq * t)
                # Volume envelope to avoid clicking at starts and ends
                if cycle_t < 0.01:
                    val *= (cycle_t / 0.01)
                elif cycle_t > 0.29:
                    val *= ((0.3 - cycle_t) / 0.01)
                sample = int(val * 16384.0)  # Moderate volume (max 32767)
            else:
                sample = 0
            
            data = struct.pack('<h', sample)
            wav_file.writeframesraw(data)

if __name__ == "__main__":
    assets_dir = "assets"
    os.makedirs(assets_dir, exist_ok=True)
    wav_path = os.path.join(assets_dir, "alarm.wav")
    print(f"Generating alarm audio at {wav_path}...")
    create_alarm_sound(wav_path)
    print("Alarm sound generated successfully!")
