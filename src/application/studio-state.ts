/** Initializes the session data exposed to the view alongside derived playback and capture state. */
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

export const demoCaption = "Synthetic source · camera off";

/** Prepares synthetic live capture with the default studio settings. */
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
    characterName: "Default character",
    characterKind: "Procedural rig · 11 joints",
    status: {
      message:
        "Demo mode is active. Turn on your camera to capture your own movements.",
      error: false,
    },
  };
}
