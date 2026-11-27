/** Frontière JSON versionnée et validée ; future implémentation GLTF via AnimationExportAdapter. */
import { jointNames, type AnimationClip } from "./types";

export interface AnimationExportAdapter {
  export(clip: AnimationClip): Promise<Blob>;
}
const fail = (): never => {
  throw new Error(
    "Clip invalide : format v1, repère, temps et quaternions normalisés requis.",
  );
};
const finiteArray = (value: unknown, size: number): value is number[] =>
  Array.isArray(value) &&
  value.length === size &&
  value.every((v) => typeof v === "number" && Number.isFinite(v));
export class AnimationSerializer {
  static parse(json: string): AnimationClip {
    if (json.length > 20_000_000)
      throw new Error("Fichier trop volumineux (20 Mo maximum).");
    const c = JSON.parse(json);
    if (
      !c ||
      c.format !== "motion-studio" ||
      c.version !== 1 ||
      typeof c.name !== "string" ||
      c.name.length > 120 ||
      typeof c.rig !== "string" ||
      c.rig.length > 120 ||
      !Number.isFinite(c.fps) ||
      c.fps < 1 ||
      c.fps > 60 ||
      !Number.isFinite(c.duration) ||
      c.duration <= 0 ||
      c.duration > 600 ||
      !Array.isArray(c.frames) ||
      c.frames.length < 2 ||
      c.frames.length > 36000
    )
      fail();
    let previous = -1;
    for (const f of c.frames) {
      if (
        !f ||
        !Number.isFinite(f.time) ||
        f.time < 0 ||
        f.time <= previous ||
        f.time > c.duration ||
        !f.pose ||
        !finiteArray(f.pose.root, 3) ||
        !f.pose.rotations
      )
        fail();
      previous = f.time;
      for (const name of jointNames) {
        const q = f.pose.rotations[name];
        if (!finiteArray(q, 4) || Math.abs(Math.hypot(...q) - 1) > 0.02) fail();
      }
    }
    if (Math.abs(previous - c.duration) > 0.001) fail();
    return c as AnimationClip;
  }
  static stringify(clip: AnimationClip): string {
    const text = JSON.stringify(clip);
    this.parse(text);
    return text;
  }
}
