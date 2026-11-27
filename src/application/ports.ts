/** Ports de la session : données sérialisables et commandes moteur sans dépendance au navigateur. */
import type { AnimationClip, PoseSample, RigPose } from "../domain/studio";

export interface RetargetOptions {
  smoothing: number;
  captureRoot: boolean;
}
export interface SessionRuntime {
  readonly rigId: string;
  startCamera(facing: "user" | "environment"): Promise<boolean>;
  stopCamera(): void;
  sample(
    nowMs: number,
    source: "demo" | "camera",
  ): PoseSample | null | undefined;
  solve(sample: PoseSample, deltaSeconds: number): RigPose | null;
  apply(pose: RigPose): void;
  render(): void;
  resetRetarget(): void;
  configureRetarget(options: RetargetOptions): void;
  resetView(): void;
  loadCharacter(bytes: ArrayBuffer, id: string): Promise<void>;
  createDemoClip(): AnimationClip;
  dispose(): Promise<void>;
}
export interface StudioStatus {
  message: string;
  error: boolean;
}
export interface StudioSnapshot {
  source: "demo" | "camera";
  mode: "live" | "playback";
  busy: boolean;
  ready: boolean;
  recording: boolean;
  playing: boolean;
  loop: boolean;
  speed: number;
  clipName: string;
  fps: number;
  facing: "user" | "environment";
  smoothing: number;
  captureRoot: boolean;
  clips: AnimationClip[];
  selectedClip: AnimationClip | null;
  time: number;
  recordingTime: number;
  sample: PoseSample | null;
  captureCaption: string;
  captureFps: number;
  characterName: string;
  characterKind: string;
  status: StudioStatus;
}
