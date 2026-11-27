/** Contrats de données du studio pour la capture, le rig et les clips JSON v1. */
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
  /** Horodatage de l’inférence en millisecondes. */
  timestamp: number;
}
export interface RigPose {
  /** Translation de la racine XYZ. */
  root: Vec3;
  /** Rotations locales en quaternions XYZW. */
  rotations: Record<JointName, Quat>;
}
export interface AnimationFrame {
  /** Temps écoulé depuis le début de l’enregistrement, en secondes. */
  time: number;
  pose: RigPose;
}
export interface AnimationClip {
  format: "motion-studio";
  version: 1;
  name: string;
  rig: string;
  fps: number;
  /** Durée déclarée en secondes. L’import tolère jusqu’à 0,001 s d’écart avec la dernière image. */
  duration: number;
  frames: AnimationFrame[];
}
