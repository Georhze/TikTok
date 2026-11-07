// Auto-generate word-level captions from an audio/video file using whisper.cpp (runs locally, free).
// Usage: npm run transcribe -- public/voiceover.mp3
// Output: public/captions.json (consumed by src/Captions.tsx)
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run transcribe -- <path-to-audio-or-video>");
  process.exit(1);
}

const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");
const WHISPER_VERSION = "1.7.6";
const MODEL = process.env.WHISPER_MODEL ?? "medium.en"; // use "medium" for non-English

await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
await downloadWhisperModel({ model: MODEL, folder: WHISPER_PATH });

// whisper.cpp needs 16kHz mono WAV
const wav = path.join(WHISPER_PATH, "input-16k.wav");
execSync(`ffmpeg -y -i "${input}" -ar 16000 -ac 1 "${wav}"`, { stdio: "inherit" });

const whisperCppOutput = await transcribe({
  inputPath: wav,
  whisperPath: WHISPER_PATH,
  whisperCppVersion: WHISPER_VERSION,
  model: MODEL,
  tokenLevelTimestamps: true,
});

const { captions } = toCaptions({ whisperCppOutput });
const out = path.join(process.cwd(), "public", "captions.json");
fs.writeFileSync(out, JSON.stringify(captions, null, 2));
console.log(`Wrote ${captions.length} captions to ${out}`);
