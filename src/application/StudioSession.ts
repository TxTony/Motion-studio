/** Coordinates capture, playback, and the library using an injected runtime and clock. */
import {
  AnimationPlayer,
  type PoseInterpolator,
} from "../domain/animation/AnimationPlayer";
import { AnimationRecorder } from "../domain/animation/AnimationRecorder";
import type { AnimationClip, PoseSample } from "../domain/studio";
import type { SessionRuntime, StudioSnapshot } from "./ports";
import {
  createStudioState,
  demoCaption,
  type StudioSettings,
  type StudioState,
} from "./studio-state";

const bodyLossMs = 750;
const recordingLimitMs = 300_000;
const demoMessage =
  "Demo mode is active. You can record and export synthetic motion.";

export interface SessionOptions {
  runtime: SessionRuntime;
  /** Monotonic clock in milliseconds, sharing the same time origin as tick. */
  now: () => number;
  interpolate: PoseInterpolator;
}

/** Extracts a message from an error reported by a port. */
function detail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class StudioSession {
  private readonly runtime: SessionRuntime;
  private readonly now: () => number;
  private readonly recorder = new AnimationRecorder();
  private readonly player: AnimationPlayer;
  private readonly state: StudioState;
  private operation: "camera" | "character" | null = null;
  private cameraGeneration = 0;
  private disposal: Promise<void> | null = null;
  private previousTick: number;
  private lastSample = 0;
  private lastPoseAt = 0;
  private recordStart = 0;

  /** Initializes live demo mode and selects the demo clip. */
  constructor({ runtime, now, interpolate }: SessionOptions) {
    this.runtime = runtime;
    this.now = now;
    this.player = new AnimationPlayer(interpolate);
    const demoClip = runtime.createDemoClip();
    this.state = createStudioState(demoClip);
    this.player.load(demoClip);
    this.previousTick = now();
  }

  /** Returns a shallow snapshot. Each addition replaces the library array. */
  get snapshot(): StudioSnapshot {
    return {
      ...this.state,
      busy: this.operation !== null,
      recording: this.recorder.recording,
      playing: this.player.playing,
      loop: this.player.loop,
      speed: this.player.speed,
      selectedClip: this.player.clip,
      time: this.player.time,
    };
  }

  /** Indicates whether recording, loading, or disposal blocks session changes. */
  private get locked(): boolean {
    return (
      this.disposal !== null ||
      this.operation !== null ||
      this.recorder.recording
    );
  }

  /** Updates settings. Smoothing, measured in seconds, remains adjustable during recording. */
  configure(patch: Partial<StudioSettings>): void {
    if (this.disposal) return;
    const smoothing = patch.smoothing ?? this.state.smoothing;
    const captureRoot = this.locked
      ? this.state.captureRoot
      : (patch.captureRoot ?? this.state.captureRoot);
    const rootChanged = captureRoot !== this.state.captureRoot;
    if (rootChanged || smoothing !== this.state.smoothing) {
      this.runtime.configureRetarget({ smoothing, captureRoot });
      this.state.smoothing = smoothing;
      this.state.captureRoot = captureRoot;
      if (rootChanged) this.runtime.resetRetarget();
    }
    if (!this.locked) {
      this.state.clipName = patch.clipName ?? this.state.clipName;
      this.state.fps = patch.fps ?? this.state.fps;
      this.state.facing = patch.facing ?? this.state.facing;
    }
  }

  /** Shows an error reported by an external caller such as the file reader. */
  reportError(message: string): void {
    if (!this.disposal) this.state.status = { message, error: true };
  }

  /** Shows a session message such as confirmation of a successful export. */
  reportInfo(message: string): void {
    if (!this.disposal) this.state.status = { message, error: false };
  }

  /** Uses the next valid pose as the origin for root motion. */
  calibrate(): void {
    if (this.disposal) return;
    this.runtime.resetRetarget();
    this.reportInfo("The next pose will set a new origin for root motion.");
  }

  /** Resets the view while preserving the current pose and session mode. */
  resetView(): void {
    if (!this.disposal) this.runtime.resetView();
  }

  /** Returns to live mode to prepare a new recording. */
  live(): void {
    if (this.locked) return;
    this.enterLive();
    this.reportInfo(
      "Live mode is active. Name the clip, then start recording.",
    );
  }

  /** Stops the camera, cancels any pending camera request, and returns to demo mode. */
  useDemo(): void {
    if (
      this.disposal ||
      this.recorder.recording ||
      this.operation === "character"
    )
      return;
    this.enterDemo();
    this.reportInfo(demoMessage);
  }

  /** Requests camera access and ignores a response after the request has been invalidated. */
  async startCamera(): Promise<void> {
    if (this.locked) return;
    const generation = ++this.cameraGeneration;
    this.operation = "camera";
    this.enterLive();
    this.reportInfo("Loading MediaPipe, then requesting camera access…");

    try {
      const active = await this.runtime.startCamera(this.state.facing);
      if (generation !== this.cameraGeneration) return;
      if (!active) {
        this.useDemo();
        return;
      }
      this.state.source = "camera";
      this.state.ready = false;
      this.lastPoseAt = this.now();
      this.state.sample = null;
      this.state.captureCaption = "Looking for a full-body pose…";
      this.reportInfo(
        "Camera is active. Keep your whole body in frame. Pose processing runs on this device.",
      );
    } catch (error) {
      if (generation !== this.cameraGeneration) return;
      this.enterDemo();
      this.reportError(
        `Camera unavailable: ${detail(error)}. Demo mode is still available.`,
      );
    } finally {
      if (generation === this.cameraGeneration) this.operation = null;
    }
  }

  /** Starts recording for the current rig when the source is ready. */
  startRecording(): void {
    if (this.locked || !this.state.ready) return;
    this.enterLive();
    this.recordStart = this.now();
    this.recorder.start(
      this.state.clipName,
      this.runtime.rigId,
      this.state.fps,
      this.recordStart,
    );
    this.state.recordingTime = 0;
    const source =
      this.state.source === "demo" ? "synthetic motion" : "camera motion";
    this.reportInfo(`Recording ${source}. Maximum duration: 5 minutes.`);
  }

  /** Stops recording and selects the resulting clip if it has enough poses. */
  stopRecording(): void {
    if (this.disposal || !this.recorder.recording) return;
    const clip = this.recorder.stop();
    if (!clip) {
      this.reportError(
        "Recording was too short or contained no detected poses. No clip was created.",
      );
      return;
    }
    this.state.clips = [...this.state.clips, clip];
    this.selectClip(clip);
    this.state.clipName = `Capture_${String(this.state.clips.length).padStart(2, "0")}`;
    this.reportInfo(
      `Recorded “${clip.name}” with ${clip.frames.length} poses. Export the JSON to keep it.`,
    );
  }

  /** Loads a clip compatible with the active rig and applies its first pose. */
  selectClip(clip: AnimationClip): void {
    if (this.locked) return;
    if (clip.rig !== this.runtime.rigId) {
      this.reportError(
        "This clip uses a different rig. Load the character used to record it.",
      );
      return;
    }
    this.player.load(clip);
    this.state.mode = "playback";
    this.runtime.resetRetarget();
    const pose = this.player.sample();
    if (pose) this.runtime.apply(pose);
    this.reportInfo(
      `Loaded “${clip.name}”. You can play it, loop it, or scrub the timeline.`,
    );
  }

  /** Toggles playback. Restarts from the beginning after the clip ends. */
  togglePlay(): void {
    const clip = this.player.clip;
    if (this.locked || !clip) return;
    if (this.state.mode === "live") {
      this.state.mode = "playback";
      this.runtime.resetRetarget();
    }
    if (this.player.time >= clip.duration) this.player.seek(0);
    this.player.playing = !this.player.playing;
  }

  /** Moves the playhead to the beginning and preserves the play or pause state. */
  rewind(): void {
    if (this.locked || !this.player.clip) return;
    this.state.mode = "playback";
    this.player.seek(0);
  }

  /** Moves the playhead to the given time in seconds and pauses playback. */
  seek(seconds: number): void {
    if (this.locked || !this.player.clip) return;
    this.player.playing = false;
    this.state.mode = "playback";
    this.player.seek(seconds);
  }

  /** Toggles looping for the selected clip. */
  toggleLoop(): void {
    if (!this.locked && this.player.clip) this.player.loop = !this.player.loop;
  }

  /** Sets the playback speed multiplier. */
  setSpeed(speed: number): void {
    if (!this.disposal) this.player.speed = speed;
  }

  /** Adds a validated clip to the library and attempts to load it. */
  importClip(clip: AnimationClip): void {
    if (this.locked) return;
    this.state.clips = [...this.state.clips, clip];
    this.selectClip(clip);
  }

  /** Waits for the rig to load and clears the selection on success. */
  async importCharacter(
    bytes: ArrayBuffer,
    id: string,
    name: string,
  ): Promise<void> {
    if (this.locked) return;
    this.operation = "character";
    this.enterLive();
    try {
      await this.runtime.loadCharacter(bytes, id);
      if (this.disposal) return;
      this.player.clip = null;
      this.player.seek(0);
      this.state.characterName = name;
      this.state.characterKind = "Imported GLB character";
      this.reportInfo(
        "GLB character loaded. New recordings will use this rig.",
      );
    } catch (error) {
      this.reportError(`Could not import GLB: ${detail(error)}`);
    } finally {
      if (!this.disposal) {
        this.operation = null;
        this.runtime.resetRetarget();
      }
    }
  }

  /** Samples the source, advances active playback, and renders the scene. */
  tick(nowMs: number): void {
    if (this.disposal) return;
    const deltaSeconds = Math.min((nowMs - this.previousTick) / 1000, 0.1);
    this.previousTick = nowMs;
    try {
      this.readCapture(nowMs);
      if (this.recorder.recording) {
        this.state.recordingTime = (nowMs - this.recordStart) / 1000;
        if (nowMs - this.recordStart > recordingLimitMs) this.stopRecording();
      }
      if (this.state.mode === "playback") {
        const pose = this.player.update(deltaSeconds);
        if (pose) this.runtime.apply(pose);
      }
      this.runtime.render();
    } catch (error) {
      this.stopRecording();
      this.enterDemo();
      this.reportError(
        `Capture interrupted: ${detail(error)}. Returned to demo mode.`,
      );
    }
  }

  /** Finishes any recording and stops the camera when the studio goes into the background. */
  suspend(): void {
    if (this.disposal) return;
    this.stopRecording();
    this.enterDemo();
    this.reportInfo(
      "Camera stopped while the studio was in the background. Turn it back on to resume.",
    );
  }

  /** Invalidates pending responses and disposes the runtime once. */
  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    this.cameraGeneration++;
    this.operation = null;
    this.recorder.stop();
    this.player.playing = false;
    this.disposal = Promise.resolve().then(() => this.runtime.dispose());
    return this.disposal;
  }

  /** Leaves playback and resets retargeting and sample timing. */
  private enterLive(): void {
    this.player.playing = false;
    this.state.mode = "live";
    this.runtime.resetRetarget();
    this.lastSample = 0;
  }

  /** Returns to demo mode while keeping any pending GLB load reserved. */
  private enterDemo(): void {
    this.cameraGeneration++;
    if (this.operation === "camera") this.operation = null;
    this.runtime.stopCamera();
    this.state.source = "demo";
    this.state.ready = true;
    this.state.sample = null;
    this.state.captureCaption = demoCaption;
    this.enterLive();
  }

  /** Keeps the previous sample between inferences and clears the skeleton when no body is detected. */
  private readCapture(nowMs: number): void {
    const sample = this.runtime.sample(nowMs, this.state.source);
    if (sample !== undefined) this.state.sample = sample;
    if (sample) this.updateLivePose(sample, nowMs);
    if (
      this.state.source === "camera" &&
      nowMs - this.lastPoseAt > bodyLossMs
    ) {
      this.state.ready = false;
      this.state.captureCaption = "Body out of view · holding last pose";
      this.state.sample = null;
    }
  }

  /** Updates camera diagnostics and sends new poses to rendering and recording. */
  private updateLivePose(sample: PoseSample, nowMs: number): void {
    const deltaSeconds = this.lastSample
      ? (nowMs - this.lastSample) / 1000
      : 1 / 30;
    this.lastSample = nowMs;
    this.lastPoseAt = nowMs;
    this.state.ready = true;
    if (this.state.source === "camera") {
      const visible = sample.image.filter(
        (point) => (point.visibility ?? 0) > 0.5,
      ).length;
      this.state.captureCaption = `${visible}/33 joints visible`;
      this.state.captureFps = Math.min(30, Math.round(1 / deltaSeconds));
    }
    if (this.state.mode === "playback") return;
    const pose = this.runtime.solve(sample, deltaSeconds);
    if (!pose) return;
    this.runtime.apply(pose);
    if (this.recorder.recording && !this.recorder.add(pose, nowMs))
      this.stopRecording();
  }
}
