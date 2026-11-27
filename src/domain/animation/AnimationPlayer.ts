/** Controls playback time and delegates pose interpolation to an injected function. */
import type { AnimationClip, RigPose } from "../studio";

/** Computes the pose between two keyframes at fraction t, from 0 to 1. */
export type PoseInterpolator = (a: RigPose, b: RigPose, t: number) => RigPose;

export class AnimationPlayer {
  clip: AnimationClip | null = null;
  time = 0;
  playing = false;
  loop = true;
  speed = 1;

  /** Binds the pose interpolator to the player. */
  constructor(private readonly interpolate: PoseInterpolator) {}

  /** Loads a clip and pauses it at the beginning. */
  load(clip: AnimationClip): void {
    this.clip = clip;
    this.time = 0;
    this.playing = false;
  }

  /** Moves the playhead to the requested time in seconds, clamped to the clip duration. */
  seek(time: number): void {
    this.time = Math.max(0, Math.min(this.clip?.duration ?? 0, time));
  }

  /** Advances active playback by the elapsed seconds, accounting for speed and looping. */
  update(delta: number): RigPose | null {
    if (this.clip && this.playing) {
      this.time += Math.max(0, delta) * this.speed;
      if (this.time >= this.clip.duration) {
        if (this.loop && this.clip.duration > 0)
          this.time %= this.clip.duration;
        else {
          this.time = this.clip.duration;
          this.playing = false;
        }
      }
    }
    return this.sample();
  }

  /** Finds keyframes around the playhead and computes their interpolation fraction. */
  sample(): RigPose | null {
    if (!this.clip?.frames.length) return null;
    const frames = this.clip.frames;
    let lo = 0,
      hi = frames.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (frames[mid].time <= this.time) lo = mid;
      else hi = mid - 1;
    }
    const a = frames[lo],
      b = frames[Math.min(lo + 1, frames.length - 1)];
    const t =
      b.time === a.time
        ? 0
        : Math.max(0, Math.min(1, (this.time - a.time) / (b.time - a.time)));
    return this.interpolate(a.pose, b.pose, t);
  }
}
