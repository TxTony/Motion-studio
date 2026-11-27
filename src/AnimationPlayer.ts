/** Lecture temporelle, recherche binaire et interpolation quaternion sans dépendance au rendu. */
import { Quaternion, Vector3 } from "three";
import { jointNames, type AnimationClip, type RigPose } from "./types";

export class AnimationPlayer {
  clip: AnimationClip | null = null;
  time = 0;
  playing = false;
  loop = true;
  speed = 1;
  load(clip: AnimationClip) {
    this.clip = clip;
    this.time = 0;
    this.playing = false;
  }
  seek(time: number) {
    this.time = Math.max(0, Math.min(this.clip?.duration ?? 0, time));
  }
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
    const rotations = {} as RigPose["rotations"];
    for (const name of jointNames)
      rotations[name] = new Quaternion()
        .fromArray(a.pose.rotations[name])
        .slerp(new Quaternion().fromArray(b.pose.rotations[name]), t)
        .toArray();
    return {
      root: new Vector3()
        .fromArray(a.pose.root)
        .lerp(new Vector3().fromArray(b.pose.root), t)
        .toArray(),
      rotations,
    };
  }
}
