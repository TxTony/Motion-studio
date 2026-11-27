/** Converts MediaPipe landmarks to character-independent Three.js directions. */
import { Matrix4, Quaternion, Vector3 } from "three";
import type { JointName, Landmark, PoseSample } from "../../domain/studio";

const minimumShoulderVisibility = 0.55;
const minimumProjectedShoulderSpanSquared = 0.00001;

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
/** Converts MediaPipe coordinates to the Three.js frame with Y up and Z forward. */
export const point = (p: Landmark) => new Vector3(p.x, -p.y, -p.z);
/** Checks the landmarks for a segment before computing its direction. */
export function visible(points: Landmark[], ids: number[]): boolean {
  return ids.every(
    (i) =>
      points[i] &&
      (points[i].visibility ?? 1) >= 0.5 &&
      [points[i].x, points[i].y, points[i].z].every(Number.isFinite),
  );
}
/** Orients the hips with X toward anatomical left, Y toward the shoulders, and Z forward. */
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

/** Measures left-to-right shoulder yaw in radians around pelvis-local +Y from 3D world landmarks. */
export function shoulderYawInPelvis(
  points: Landmark[],
  pelvis: Quaternion,
): number | null {
  const left = points[11];
  const right = points[12];
  if (!reliableShoulder(left) || !reliableShoulder(right)) return null;

  const axis = point(right)
    .sub(point(left))
    .applyQuaternion(pelvis.clone().invert());
  const projectedSpanSquared = axis.x ** 2 + axis.z ** 2;
  if (
    !Number.isFinite(projectedSpanSquared) ||
    projectedSpanSquared < minimumProjectedShoulderSpanSquared
  )
    return null;

  // At rest the left-to-right axis points toward -X. Positive +Y rotation takes it toward +Z.
  return Math.atan2(axis.z, -axis.x);
}

/** Requires finite world geometry and explicit shoulder tracking confidence. */
function reliableShoulder(
  shoulder: Landmark | undefined,
): shoulder is Landmark {
  return (
    !!shoulder &&
    (shoulder.visibility ?? 0) >= minimumShoulderVisibility &&
    [shoulder.x, shoulder.y, shoulder.z, shoulder.visibility].every(
      Number.isFinite,
    )
  );
}

/** Provides a synthetic source to exercise the capture pipeline without a camera. */
export function demoSample(seconds: number): PoseSample {
  const world: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0,
    y: -1.8,
    z: 0,
    visibility: 1,
  }));
  /** Places a visible synthetic landmark in capture coordinates. */
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
