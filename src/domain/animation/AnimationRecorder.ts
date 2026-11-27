/** Échantillonne les poses locales et conserve les lacunes de capture dans les temps du clip. */
import type { AnimationClip, RigPose } from "../studio";

export class AnimationRecorder {
  private clip: AnimationClip | null = null;
  private started = 0;
  private last = -Infinity;

  /** Indique si un clip est en cours de capture. */
  get recording(): boolean {
    return this.clip !== null;
  }

  /** Démarre un clip et fixe son origine temporelle à l’horodatage en millisecondes. */
  start(name: string, rig: string, fps: number, now: number): void {
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

  /** Copie les poses à la cadence du clip. Retourne false hors capture ou après 300 secondes. */
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

  /** Termine la capture et retourne le clip si au moins deux poses couvrent une durée positive. */
  stop(): AnimationClip | null {
    const result = this.clip;
    this.clip = null;
    return result && result.frames.length > 1 && result.duration > 0
      ? result
      : null;
  }
}
