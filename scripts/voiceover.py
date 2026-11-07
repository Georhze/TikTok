# Generates the voiceover + word-timed captions for the SpaceScale video with Kokoro TTS.
# Setup (once):
#   python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
#   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
#   mv kokoro-v1.0.onnx kokoro.onnx; mv voices-v1.0.bin voices.bin
# Run:  .venv/bin/python scripts/voiceover.py <dir-with-model-files> <output-dir>
#   then: ffmpeg -i <out>/voiceover.wav -af loudnorm=I=-14:TP=-1.5 -b:a 192k public/space/voiceover.mp3
#         cp <out>/captions.json public/space/   and update LINES in src/space/timeline.ts from segments.json
import json, sys, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
d = sys.argv[1]; out = sys.argv[2]
k = Kokoro(f"{d}/kokoro.onnx", f"{d}/voices.bin")
lines = [
 "You think Earth is big? Watch this.",
 "This is Jupiter. Thirteen hundred Earths could fit inside it.",
 "But next to the Sun, Jupiter is tiny.",
 "One point three million Earths could fit inside the Sun.",
 "Now meet UY Scuti, one of the biggest stars we know.",
 "Hundreds of millions of Suns could fit inside it.",
 "And it's just one of billions of stars in our galaxy.",
 "Follow for more mind-blowing space facts.",
]
GAP = 0.35; LEAD = 0.25
sr = 24000; chunks = [np.zeros(int(LEAD*sr), dtype=np.float32)]; t = LEAD
segs = []; caps = []
for i, line in enumerate(lines):
    a, sr = k.create(line.replace("UY Scuti", "U Y Skootee"), voice="am_michael", speed=1.08, lang="en-us")
    # trim silence
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0]-240): idx[-1]+480]
    dur = len(a)/sr
    segs.append({"text": line, "startMs": round(t*1000), "endMs": round((t+dur)*1000)})
    words = line.split(" ")
    w = [len(re.sub(r"[^A-Za-z0-9]", "", x)) + 2 + (3 if re.search(r"[.,?]$", x) else 0) for x in words]
    tot = sum(w); c = t
    for j, word in enumerate(words):
        wd = dur * w[j]/tot
        caps.append({"text": (" " if (j or i) else "") + word, "startMs": round(c*1000), "endMs": round((c+wd)*1000),
                     "timestampMs": round((c+wd/2)*1000), "confidence": 1})
        c += wd
    chunks += [a, np.zeros(int(GAP*sr), dtype=np.float32)]; t += dur + GAP
sf.write(f"{out}/voiceover.wav", np.concatenate(chunks), sr)
json.dump(caps, open(f"{out}/captions.json", "w"), indent=1)
json.dump(segs, open(f"{out}/segments.json", "w"), indent=1)
print(json.dumps(segs, indent=1)); print("total", t)
