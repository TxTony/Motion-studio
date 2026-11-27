/** Contrats partagés : poses locales indépendantes du moteur de capture et du modèle. */
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
  timestamp: number;
}
export interface RigPose {
  root: Vec3;
  rotations: Record<JointName, Quat>;
}
export interface AnimationFrame {
  time: number;
  pose: RigPose;
}
export interface AnimationClip {
  format: "motion-studio";
  version: 1;
  name: string;
  rig: string;
  fps: number;
  duration: number;
  frames: AnimationFrame[];
}
