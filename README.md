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
