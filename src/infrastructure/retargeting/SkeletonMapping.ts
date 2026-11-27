/** Convertit les repères MediaPipe en directions Three.js ; aucune dépendance au personnage. */
import { Matrix4, Quaternion, Vector3 } from "three";
import type { JointName, Landmark, PoseSample } from "../../domain/studio";

export const connections = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [0, 7],
  [0, 8],
];
export const limbPairs: Partial<Record<JointName, [number, number]>> = {
  leftUpperArm: [11, 13],
  leftLowerArm: [13, 15],
  rightUpperArm: [12, 14],
  rightLowerArm: [14, 16],
  leftUpperLeg: [23, 25],
  leftLowerLeg: [25, 27],
  rightUpperLeg: [24, 26],
  rightLowerLeg: [26, 28],
};
/** Convertit le repère MediaPipe en repère Three.js Y haut, Z frontal. */
export const point = (p: Landmark) => new Vector3(p.x, -p.y, -p.z);
/** Valide les points utiles d’un segment avant d’en calculer la direction. */
export function visible(points: Landmark[], ids: number[]): boolean {
  return ids.every(
    (i) =>
      points[i] &&
      (points[i].visibility ?? 1) >= 0.5 &&
      [points[i].x, points[i].y, points[i].z].every(Number.isFinite),
  );
}
/** Orientation du bassin : X vers la gauche anatomique, Y vers les épaules, Z frontal. */
export function torsoOrientation(points: Landmark[]): Quaternion | null {
  if (!visible(points, [11, 12, 23, 24])) return null;
  const x = point(points[23]).sub(point(points[24])).normalize();
  const y = point(points[11])
    .add(point(points[12]))
    .sub(point(points[23]))
    .sub(point(points[24]))
    .normalize();
  const z = new Vector3().crossVectors(x, y).normalize();
  if (z.lengthSq() < 0.5) return null;
  x.crossVectors(y, z).normalize();
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().makeBasis(x, y, z),
  );
}

/** Source synthétique explicitement signalée, pour vérifier toute la chaîne sans caméra. */
export function demoSample(seconds: number): PoseSample {
  const world: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0,
    y: -1.8,
    z: 0,
    visibility: 1,
  }));
  /** Place un point synthétique visible dans le repère de capture. */
  const put = (i: number, x: number, y: number, z = 0) => {
    world[i] = { x, y, z, visibility: 1 };
  };
  put(23, 0.19, 0);
  put(24, -0.19, 0);
  put(11, 0.35, -0.65);
  put(12, -0.35, -0.65);
  put(0, 0, -1.05);
  for (const [side, shoulder, elbow, wrist, hip, knee, ankle] of [
    [1, 11, 13, 15, 23, 25, 27],
    [-1, 12, 14, 16, 24, 26, 28],
  ]) {
    const wave = Math.sin(seconds * 2 + side * 0.8);
    put(elbow, side * 0.68, -0.55 - wave * 0.18, -0.1);
    put(wrist, side * (0.84 + 0.08 * wave), -0.65 - wave * 0.42, -0.24);
    put(knee, side * 0.21, 0.43, -0.03 - 0.08 * Math.sin(seconds * 2 + side));
    put(ankle, side * 0.25, 0.88, 0.02);
    void shoulder;
    void hip;
  }
  put(7, 0.12, -1.06);
  put(8, -0.12, -1.06);
  const image = world.map((p) => ({
    ...p,
    x: 0.5 + p.x * 0.46,
    y: 0.52 + p.y * 0.43,
    z: p.z * 0.46,
  }));
  return { world, image, timestamp: seconds * 1000 };
}
