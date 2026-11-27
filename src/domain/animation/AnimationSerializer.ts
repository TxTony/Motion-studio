/** Convertit les clips v1 en JSON et valide les données décodées avant leur usage métier. */
import { jointNames, type AnimationClip } from "../studio";

/** Signale que le document ne respecte pas un invariant du clip v1. */
function fail(): never {
  throw new Error(
    "Clip invalide : format v1, repère, temps et quaternions normalisés requis.",
  );
}

/** Permet l’inspection des propriétés d’un objet JSON encore inconnu. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Permet l’inspection des entrées d’un tableau sans déduire leur type. */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Vérifie qu’une valeur JSON est un nombre fini. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Vérifie la taille et les composantes numériques d’une translation ou d’un quaternion. */
function isFiniteArray(value: unknown, size: number): value is number[] {
  return isArray(value) && value.length === size && value.every(isFiniteNumber);
}

/** Vérifie l’ordre du temps en secondes et les onze rotations locales avant de retenir ce temps. */
function validateFrame(
  frame: unknown,
  duration: number,
  previous: number,
): number {
  if (
    !isRecord(frame) ||
    !isFiniteNumber(frame.time) ||
    frame.time < 0 ||
    frame.time <= previous ||
    frame.time > duration ||
    !isRecord(frame.pose) ||
    !isFiniteArray(frame.pose.root, 3) ||
    !isRecord(frame.pose.rotations)
  )
    fail();

  for (const name of jointNames) {
    const rotation = frame.pose.rotations[name];
    if (
      !isFiniteArray(rotation, 4) ||
      Math.abs(Math.hypot(...rotation) - 1) > 0.02
    )
      fail();
  }
  return frame.time;
}

/** Vérifie l’en-tête v1, les images clés et leur cohérence avec la durée déclarée. */
function validateClip(value: unknown): asserts value is AnimationClip {
  if (
    !isRecord(value) ||
    value.format !== "motion-studio" ||
    value.version !== 1 ||
    typeof value.name !== "string" ||
    value.name.length > 120 ||
    typeof value.rig !== "string" ||
    value.rig.length > 120 ||
    !isFiniteNumber(value.fps) ||
    value.fps < 1 ||
    value.fps > 60 ||
    !isFiniteNumber(value.duration) ||
    value.duration <= 0 ||
    value.duration > 600 ||
    !isArray(value.frames) ||
    value.frames.length < 2 ||
    value.frames.length > 36000
  )
    fail();

  let previous = -1;
  for (const frame of value.frames)
    previous = validateFrame(frame, value.duration, previous);

  if (Math.abs(previous - value.duration) > 0.001) fail();
}

export class AnimationSerializer {
  /** Décode et valide une chaîne JSON, limitée à 20 millions d’unités UTF-16. */
  static parse(json: string): AnimationClip {
    if (json.length > 20_000_000)
      throw new Error("Fichier trop volumineux (20 Mo maximum).");
    const clip: unknown = JSON.parse(json);
    validateClip(clip);
    return clip;
  }

  /** Encode le clip puis applique les mêmes limites que lors d’un import. */
  static stringify(clip: AnimationClip): string {
    const text = JSON.stringify(clip);
    this.parse(text);
    return text;
  }
}
