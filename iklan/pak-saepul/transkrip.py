import sys, subprocess, numpy as np
from faster_whisper import WhisperModel
def baca(f):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-f","s16le","-ac","1","-ar","16000","-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
m = WhisperModel("small", device="cpu", compute_type="int8")
for f in sys.argv[1:]:
    segs, info = m.transcribe(baca(f), language="id")
    print(f, "->", " ".join(s.text.strip() for s in segs))
