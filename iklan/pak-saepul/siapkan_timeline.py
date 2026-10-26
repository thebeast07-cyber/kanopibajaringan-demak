import json, re, subprocess, difflib, numpy as np
from faster_whisper import WhisperModel
FPS = 30
naskah = json.loads(re.search(r'<script type="application/json" id="data">(.*?)</script>', open('naskah/naskah-cerita-1.html').read(), re.S).group(1))
dialog = {f"{i+1:02d}": a['dialog'] for i, a in enumerate(naskah['adegan'])}
dialog['09'] = re.sub(r'\s*hehe\s*$', '', dialog['09'])  # tidak terdengar di audio

def baca(f, sr=16000):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-f","s16le","-ac","1","-ar",str(sr),"-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())

m = WhisperModel("medium", device="cpu", compute_type="int8")
kata, env, dur = {}, {}, {}
for no in sorted(dialog):
    f = f"suara/klip/{no}.wav"
    a = baca(f)
    dur[no] = round(len(a) / 16000, 3)
    segs, _ = m.transcribe(a, language="id", word_timestamps=True)
    wh = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]
    sk = dialog[no].split()
    t = [None] * len(sk)
    sm = difflib.SequenceMatcher(a=[norm(w) for w in sk], b=[norm(w[2]) for w in wh], autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): t[blk.a + k] = [wh[blk.b + k][0], wh[blk.b + k][1]]
    v0, v1 = wh[0][0], wh[-1][1]
    # isi kata yang tidak cocok: bagi rata di antara tetangga yang sudah punya waktu
    i = 0
    while i < len(sk):
        if t[i] is None:
            j = i
            while j < len(sk) and t[j] is None: j += 1
            a0 = t[i-1][1] if i > 0 else v0
            b0 = t[j][0] if j < len(sk) else v1
            n = j - i
            for k in range(n): t[i+k] = [a0 + (b0-a0)*k/n, a0 + (b0-a0)*(k+1)/n]
            i = j
        else: i += 1
    kata[no] = [{"w": w, "s": round(s, 2), "e": round(e, 2)} for w, (s, e) in zip(sk, t)]
    # amplop suara per frame buat gerak mulut
    hop = 16000 // FPS
    r = np.array([np.sqrt(np.mean(a[k:k+hop]**2) + 1e-12) for k in range(0, len(a), hop)])
    r = r / (np.percentile(r, 95) + 1e-9)
    env[no] = [round(float(min(1, x)), 3) for x in r]
    print(no, " ".join(f"{k['w']}@{k['s']}" for k in kata[no]))

# susunan adegan: (id, lead, klip, tail) atau (id, durasi)
susun = [("s1",.4,"01",.3),("s2",.2,"02",.3),("s3",.6,"03",.3),("s4",.1,"04",.3),("s5",.2,"05",.3),("s6",.1,"06",.6),
         ("t1",1.0),("s7",.6,"07",.2),("s8",.1,"08",.7),("t2",2.2),("s9",.5,"09",.6),("akhir",4.5)]
adegan, t = [], 0.0
for x in susun:
    if len(x) == 2:
        adegan.append({"id": x[0], "mulai": round(t,3), "durasi": x[1]}); t += x[1]
    else:
        i, lead, no, tail = x
        d = lead + dur[no] + tail
        adegan.append({"id": i, "mulai": round(t,3), "durasi": round(d,3), "klip": no, "klipMulai": round(t+lead,3), "klipDurasi": dur[no]}); t += d
json.dump({"fps": FPS, "total": round(t,3), "adegan": adegan, "kata": kata, "env": env, "tokoh": {t_['id']: t_['nama'] for t_ in naskah['tokoh']}, "penutup": naskah['penutup']},
          open("suara/timeline.json","w"), ensure_ascii=False)
print("total", round(t,2))
