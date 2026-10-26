# Gabung klip dialog sesuai waktu adegan di suara/timeline.json, plus suara hujan tipis.
# Hasil: animasi/trek-suara.wav
import json, subprocess
tl = json.load(open('suara/timeline.json')); A = {a['id']: a for a in tl['adegan']}; total = tl['total']
inp, flt, lbl = [], [], []
for a in tl['adegan']:
    if 'klip' in a:
        i = len(lbl); inp += ['-i', f"suara/klip/{a['klip']}.wav"]; ms = int(a['klipMulai'] * 1000)
        flt.append(f"[{i}]adelay={ms}|{ms}[d{i}]"); lbl.append(f"[d{i}]")
nd = len(lbl)
r1a, r1b = 0, A['t1']['mulai'] + 0.4
r2a, r2b = A['s9']['mulai'], A['akhir']['mulai'] + 0.8
inp += ['-f', 'lavfi', '-i', f"anoisesrc=color=pink:amplitude=0.5:duration={total}:sample_rate=48000"]
flt.append(f"[{nd}]lowpass=f=1800,highpass=f=200,volume='if(between(t,{r1a},{r1b}),0.10,if(between(t,{r2a},{r2b}),0.16,0))':eval=frame,afade=t=in:d=0.6[hj]")
lbl.append('[hj]')
flt.append(f"{''.join(lbl)}amix=inputs={len(lbl)}:normalize=0,alimiter=limit=0.95,apad=whole_dur={total}[out]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inp, '-filter_complex', ';'.join(flt), '-map', '[out]',
                '-ac', '2', '-ar', '48000', '-t', str(total), 'animasi/trek-suara.wav'], check=True)
print('trek suara jadi,', total, 'detik')
