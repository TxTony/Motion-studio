/** Copies WASM binaries from the locked npm package into the site's assets. */
import { cp, mkdir } from "node:fs/promises";
const destination = new URL("../public/mediapipe/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(
  new URL("../node_modules/@mediapipe/tasks-vision/wasm/", import.meta.url),
  destination,
  { recursive: true },
);
console.log("MediaPipe WASM ready (served with the site).");
