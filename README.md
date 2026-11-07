# TikTok 3D Videos — Three.js + Remotion

Vertical (1080×1920, 30fps) 3D animated videos with TikTok-style captions and audio.

| Piece | Package |
|---|---|
| 3D rendering | `three`, `@react-three/fiber`, `@react-three/drei` |
| 3D inside Remotion | `@remotion/three` (`<ThreeCanvas>`) |
| Video rendering | `remotion`, `@remotion/cli` |
| Audio / video clips | `@remotion/media` (`<Audio>`, `<Video>`) |
| Captions | `@remotion/captions` (TikTok-style word highlighting) |
| Auto-transcription | `@remotion/install-whisper-cpp` (local Whisper, free) |

## Setup
Requires Node 18+ and ffmpeg.
```bash
npm install
npm run dev          # opens Remotion Studio at http://localhost:3000 (live preview)
npm run render       # renders out/video.mp4
```

## Project layout
```
src/Root.tsx      Composition definitions (size, fps, duration)
src/Main3D.tsx    Layers: 3D scene + captions + audio
src/Scene.tsx     The Three.js scene — edit this for your animation
src/Captions.tsx  TikTok-style animated captions
public/           Put audio, video, images, captions.json here
scripts/transcribe.mjs  Audio → captions.json via Whisper
```

## Workflow
1. Drop your voiceover in `public/`, e.g. `public/voiceover.mp3`.
2. Generate captions: `npm run transcribe -- public/voiceover.mp3` → writes `public/captions.json`
   (first run downloads whisper.cpp + model; set `WHISPER_MODEL=medium` for non-English).
3. Set `audioFile: "voiceover.mp3"` in `src/Main3D.tsx` (or in the Studio props panel).
4. Adjust `durationInFrames` in `src/Root.tsx` to match the audio length (seconds × 30).
5. `npm run render`.

## Rules for 3D animation
- Always use `<ThreeCanvas>` from `@remotion/three`, not R3F's `<Canvas>`.
- Animate with `useCurrentFrame()` / `interpolate()` / `spring()` — **never** `useFrame()` or `Date.now()`,
  otherwise renders will flicker/be non-deterministic.
- Load models with drei's `useGLTF` (put `.glb` files in `public/` and use `staticFile("model.glb")`).

## Rendering on a server without GPU
```bash
npx remotion render Main3D out/video.mp4 --gl=swangle
```

---

# Video #1 — "You think Earth is big?" (space scale comparison)

Composition **`SpaceScale`** (26s): Earth → Jupiter → Sun → UY Scuti → Milky Way, all at true relative size,
with a continuous zoom-out, count-up stat cards, TikTok captions, voiceover, ambient music and whoosh/impact SFX.

```bash
npm run render      # -> out/space-scale.mp4
npm run thumbnail   # -> out/thumbnail.png
```

| File | What it does |
|---|---|
| `src/space/timeline.ts` | Real radii, layout, camera keyframes, voice-line frame timings |
| `src/space/SpaceScene.tsx` | Three.js scene: planets, stars, starfield, galaxy (orthographic camera = true scale) |
| `src/space/textures.ts` | Procedural planet/star textures (seeded noise — no image assets) |
| `src/space/Overlay.tsx` | Stat cards with count-up numbers, "you are here" labels, CTA |
| `src/space/SpaceVideo.tsx` | Layers 3D + overlay + captions + audio tracks |
| `public/space/` | `voiceover.mp3`, `captions.json`, `music.mp3`, `whoosh.wav`, `impact.wav` |

**Audio sources:** the voiceover was generated with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (open-weight TTS,
voice `am_michael`); music and SFX were synthesized with ffmpeg — everything is royalty-free.
If you change the script, regenerate the voiceover and update `LINES` in `timeline.ts` to the new line start frames.

**Suggested post caption:** `You are smaller than you think 🤯🌍 #space #universe #astronomy #science #spacefacts #fyp`
