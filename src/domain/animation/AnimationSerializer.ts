/** Encodes JSON v1 clips and validates decoded data before use in the studio. */
import { jointNames, type AnimationClip } from "../studio";

/** Reports a violation of the v1 clip format. */
function fail(): never {
  throw new Error(
    "Invalid clip. Version 1 requires a rig, valid timing, and normalized quaternions.",
  );
}

/** Narrows an unknown JSON value to an object with inspectable properties. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrows an unknown value to an array with unknown element types. */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Checks that a JSON value is a finite number. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Checks the size and numeric components of a translation or quaternion. */
function isFiniteArray(value: unknown, size: number): value is number[] {
  return isArray(value) && value.length === size && value.every(isFiniteNumber);
}

/** Validates a keyframe timestamp in seconds and its eleven local rotations, then returns the timestamp. */
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

/** Validates the v1 header and checks that keyframes agree with the declared duration. */
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
  /** Decodes and validates JSON of up to 20 million UTF-16 code units. */
  static parse(json: string): AnimationClip {
    if (json.length > 20_000_000)
      throw new Error("File is too large (20 MB maximum).");
    const clip: unknown = JSON.parse(json);
    validateClip(clip);
    return clip;
  }

  /** Encodes a clip and applies the same validation as import. */
  static stringify(clip: AnimationClip): string {
    const text = JSON.stringify(clip);
    this.parse(text);
    return text;
  }
}
