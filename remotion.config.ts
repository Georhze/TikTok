import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL (Three.js) needs a GPU-capable backend. "angle" works on most machines;
// on headless Linux servers without a GPU use "swangle" (software rendering).
Config.setChromiumOpenGlRenderer("angle");
