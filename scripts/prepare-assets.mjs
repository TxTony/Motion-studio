/** Copie les binaires WASM de la version npm verrouillée vers les ressources du site. */
import { cp, mkdir } from "node:fs/promises";
const destination = new URL("../public/mediapipe/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(
  new URL("../node_modules/@mediapipe/tasks-vision/wasm/", import.meta.url),
  destination,
  { recursive: true },
);
console.log("MediaPipe WASM prêt (hébergé avec le site).");
