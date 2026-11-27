/** Initialise les données de session exposées à la vue, hors états dérivés du lecteur et de la capture. */
import type { AnimationClip } from "../domain/studio";
import type { StudioSnapshot } from "./ports";

export type StudioSettings = Pick<
  StudioSnapshot,
  "clipName" | "fps" | "facing" | "smoothing" | "captureRoot"
>;

export type StudioState = Omit<
  StudioSnapshot,
  "busy" | "recording" | "playing" | "loop" | "speed" | "selectedClip" | "time"
>;

export const demoCaption = "Source synthétique · aucune caméra active";

/** Prépare le temps réel synthétique avec les réglages par défaut du prototype. */
export function createStudioState(initialClip: AnimationClip): StudioState {
  return {
    source: "demo",
    mode: "live",
    ready: true,
    clipName: "Capture_01",
    fps: 30,
    facing: "user",
    smoothing: 0.12,
    captureRoot: false,
    clips: [initialClip],
    recordingTime: 0,
    sample: null,
    captureCaption: demoCaption,
    captureFps: 30,
    characterName: "Gobelin mécano",
    characterKind: "Rig procédural · 11 articulations",
    status: {
      message:
        "Mode démo actif. Activez votre caméra pour capturer vos propres mouvements.",
      error: false,
    },
  };
}
