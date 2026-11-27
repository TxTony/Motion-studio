/** Échantillonne les poses locales en secondes ; conserve les lacunes de capture dans les temps. */
import type { AnimationClip, RigPose } from "./types";

export class AnimationRecorder {
  private clip: AnimationClip | null = null;
  private started = 0;
  private last = -Infinity;
  get recording() {
    return this.clip !== null;
  }
  start(name: string, rig: string, fps: number, now: number) {
    this.clip = {
      format: "motion-studio",
      version: 1,
      name: name.trim() || "Nouvelle capture",
      rig,
      fps,
      duration: 0,
      frames: [],
    };
    this.started = now;
    this.last = -Infinity;
  }
  /** Retourne false au-delà de cinq minutes pour borner la mémoire du POC. */
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
  stop(): AnimationClip | null {
    const result = this.clip;
    this.clip = null;
    return result && result.frames.length > 1 && result.duration > 0
      ? result
      : null;
  }
}
