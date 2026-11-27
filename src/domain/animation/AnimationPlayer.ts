/** Pilote le temps de lecture et confie l’interpolation des poses au port injecté. */
import type { AnimationClip, RigPose } from "../studio";

/** Calcule la pose à la fraction t, de 0 à 1, entre les deux poses encadrantes. */
export type PoseInterpolator = (a: RigPose, b: RigPose, t: number) => RigPose;

export class AnimationPlayer {
  clip: AnimationClip | null = null;
  time = 0;
  playing = false;
  loop = true;
  speed = 1;

  /** Associe le calcul des poses au lecteur. */
  constructor(private readonly interpolate: PoseInterpolator) {}

  /** Charge un clip et replace le lecteur en pause au début. */
  load(clip: AnimationClip): void {
    this.clip = clip;
    this.time = 0;
    this.playing = false;
  }

  /** Déplace la tête de lecture au temps demandé en secondes, borné à la durée du clip. */
  seek(time: number): void {
    this.time = Math.max(0, Math.min(this.clip?.duration ?? 0, time));
  }

  /** Avance la lecture active du delta en secondes, en tenant compte de la vitesse et de la boucle. */
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

  /** Cherche les images clés autour du temps de lecture et calcule leur fraction d’interpolation. */
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
