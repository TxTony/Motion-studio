/** Samples local poses while preserving capture gaps in the clip timestamps. */
import type { AnimationClip, RigPose } from "../studio";

export class AnimationRecorder {
  private clip: AnimationClip | null = null;
  private started = 0;
  private last = -Infinity;

  /** Indicates whether a clip is being recorded. */
  get recording(): boolean {
    return this.clip !== null;
  }

  /** Starts a clip at the given timestamp in milliseconds. */
  start(name: string, rig: string, fps: number, now: number): void {
    this.clip = {
      format: "motion-studio",
      version: 1,
      name: name.trim() || "New capture",
      rig,
      fps,
      duration: 0,
      frames: [],
    };
    this.started = now;
    this.last = -Infinity;
  }

  /** Copies poses at the clip rate. Returns false if idle or after 300 seconds. */
  add(pose: RigPose, now: number): boolean {
    if (!this.clip) return false;
    const time = (now - this.started) / 1000;
    if (time > 300) return false;
    if (time < this.last + 1 / this.clip.fps - 0.001) return true;
    this.clip.frames.push({ time, pose: structuredClone(pose) });
    this.clip.duration = time;
    this.last = time;
    return true;
  }

  /** Ends recording and returns the clip if at least two poses span a positive duration. */
  stop(): AnimationClip | null {
    const result = this.clip;
    this.clip = null;
    return result && result.frames.length > 1 && result.duration > 0
      ? result
      : null;
  }
}
