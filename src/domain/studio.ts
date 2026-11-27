/** Studio data contracts for motion capture, character rigs, and JSON v1 clips. */
export const jointNames = [
  "hips",
  "spine",
  "head",
  "leftUpperArm",
  "leftLowerArm",
  "rightUpperArm",
  "rightLowerArm",
  "leftUpperLeg",
  "leftLowerLeg",
  "rightUpperLeg",
  "rightLowerLeg",
] as const;
export type JointName = (typeof jointNames)[number];
export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
export interface PoseSample {
  image: Landmark[];
  world: Landmark[];
  /** Inference timestamp in milliseconds. */
  timestamp: number;
}
export interface RigPose {
  /** Root translation in XYZ order. */
  root: Vec3;
  /** Local rotations as XYZW quaternions. */
  rotations: Record<JointName, Quat>;
}
export interface AnimationFrame {
  /** Seconds elapsed since the recording started. */
  time: number;
  pose: RigPose;
}
export interface AnimationClip {
  format: "motion-studio";
  version: 1;
  name: string;
  rig: string;
  fps: number;
  /** Declared duration in seconds. Import allows a difference of up to 0.001 s from the last keyframe. */
  duration: number;
  frames: AnimationFrame[];
}
