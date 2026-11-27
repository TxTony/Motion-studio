/** Tests coordinate conversion, occlusion, and smoothing on a procedural rig without WebGL. */
import { describe, it, expect } from "vitest";
import { Quaternion, Vector3 } from "three";
import { createDefaultCharacter } from "../src/infrastructure/three/CharacterRenderer";
import { Retargeting } from "../src/infrastructure/retargeting/Retargeting";
import {
  demoSample,
  torsoOrientation,
  point,
} from "../src/infrastructure/retargeting/SkeletonMapping";
import {
  jointNames,
  type JointName,
  type Landmark,
  type PoseSample,
} from "../src/domain/studio";
import type { CharacterRig } from "../src/infrastructure/three/CharacterRenderer";

/** Creates an expected signed rotation around positive Y. */
function yaw(degrees: number): Quaternion {
  return new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    (degrees * Math.PI) / 180,
  );
}

/** Turns shoulders about their center and the whole pose about the pelvis, independently. */
function turnedSample(shoulderDegrees: number, globalDegrees = 0): PoseSample {
  const world: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 1,
  }));
  const shoulderTurn = yaw(shoulderDegrees);
  const wholeBodyTurn = yaw(globalDegrees);
  const leftShoulder = new Vector3(0.35, 0, 0).applyQuaternion(shoulderTurn);
  const rightShoulder = leftShoulder.clone().negate();
  const points = [
    [11, leftShoulder.x, 0.65, leftShoulder.z],
    [12, rightShoulder.x, 0.65, rightShoulder.z],
    [13, 0.68, 0.48, 0.1],
    [14, -0.52, 0.38, 0.22],
    [15, 0.8, 0.25, 0.2],
    [16, -0.71, 0.21, 0.25],
    [23, 0.19, 0, 0],
    [24, -0.19, 0, 0],
    [25, 0.21, -0.43, 0.06],
    [26, -0.21, -0.43, 0.06],
    [27, 0.25, -0.87, 0],
    [28, -0.25, -0.87, 0],
  ];
  for (const [index, x, y, z] of points) {
    const rotated = new Vector3(x, y, z).applyQuaternion(wholeBodyTurn);
    world[index] = {
      x: rotated.x,
      y: -rotated.y,
      z: -rotated.z,
      visibility: 1,
    };
  }
  const image = world.map(() => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  return { world, image, timestamp: 0 };
}

/** Reads the joint orientation after solving and parent-space conversion. */
function worldRotation(rig: CharacterRig, name: JointName): Quaternion {
  return rig.joints[name].node.getWorldQuaternion(new Quaternion());
}

describe("Retargeting", () => {
  it("converts to Y-up coordinates and preserves relative depth", () => {
    expect(point({ x: 1, y: 2, z: 3 }).toArray()).toEqual([1, -2, -3]);
    expect(
      torsoOrientation(demoSample(0).world)!.angleTo(new Quaternion()),
    ).toBeCloseTo(0);
  });
  it("produces normalized quaternions and follows motion", () => {
    const rig = createDefaultCharacter(),
      r = new Retargeting();
    r.smoothing = 0;
    const a = structuredClone(r.solve(demoSample(0), rig, 1 / 30)!);
    const b = r.solve(demoSample(1), rig, 1 / 30)!;
    for (const n of jointNames)
      expect(Math.hypot(...b.rotations[n])).toBeCloseTo(1);
    expect(b.rotations.leftLowerArm).not.toEqual(a.rotations.leftLowerArm);
  });
  it("smooths motion while converging to the target", () => {
    const rig = createDefaultCharacter(),
      r = new Retargeting();
    const a = structuredClone(r.solve(demoSample(0), rig, 1 / 30)!);
    const b = structuredClone(r.solve(demoSample(1), rig, 1 / 30)!);
    expect(b.rotations.leftUpperArm).not.toEqual(a.rotations.leftUpperArm);
    const direct = new Retargeting();
    direct.smoothing = 0;
    const target = direct.solve(
      demoSample(1),
      createDefaultCharacter(),
      1 / 30,
    )!;
    const angle = (p: typeof a) =>
      new Quaternion()
        .fromArray(p.rotations.leftUpperArm)
        .angleTo(new Quaternion().fromArray(target.rotations.leftUpperArm));
    expect(angle(b)).toBeLessThan(angle(a));
    expect(angle(b)).toBeGreaterThan(0.0001);
    let end = b;
    for (let i = 0; i < 80; i++) end = r.solve(demoSample(1), rig, 1 / 30)!;
    expect(angle(end)).toBeLessThan(0.0001);
  });
  it("skips an occluded pelvis and holds an occluded limb in place", () => {
    const rig = createDefaultCharacter(),
      r = new Retargeting(),
      sample = demoSample(0);
    sample.world[23].visibility = 0;
    expect(r.solve(sample, rig, 0.03)).toBeNull();
    const a = structuredClone(r.solve(demoSample(0), rig, 0.03)!);
    const missing = demoSample(1);
    missing.world[15].visibility = 0;
    expect(r.solve(missing, rig, 0.03)!.rotations.leftLowerArm).toEqual(
      a.rotations.leftLowerArm,
    );
  });
  it("re-centers experimental root motion and leaves it disabled by default", () => {
    const rig = createDefaultCharacter(),
      r = new Retargeting();
    r.smoothing = 0;
    r.captureRoot = true;
    r.solve(demoSample(0), rig, 0.03);
    const moved = demoSample(0);
    moved.image[23].x += 0.1;
    moved.image[24].x += 0.1;
    expect(r.solve(moved, rig, 0.03)!.root[0]).toBeCloseTo(0.3);
    r.reset();
    expect(r.solve(moved, rig, 0.03)!.root[0]).toBe(0);
  });
});

describe("torso follow", () => {
  it.each([30, -30])(
    "turns the spine and head with %i degrees of shoulder yaw and leaves hips fixed",
    (degrees) => {
      const rig = createDefaultCharacter();
      const solver = new Retargeting();
      solver.smoothing = 0;
      const sample = turnedSample(degrees);
      sample.world[11].y -= 0.3;
      sample.world[12].y += 0.3;
      solver.solve(sample, rig, 1 / 30);

      expect(worldRotation(rig, "hips").angleTo(yaw(0))).toBeCloseTo(0, 6);
      for (const joint of ["spine", "head"] as const) {
        expect(worldRotation(rig, joint).angleTo(yaw(degrees / 2))).toBeCloseTo(
          0,
          6,
        );
      }
    },
  );

  it("preserves local torso yaw when the pelvis and shoulders turn together", () => {
    const rig = createDefaultCharacter();
    const solver = new Retargeting();
    solver.smoothing = 0;
    solver.solve(turnedSample(30, 70), rig, 1 / 30);

    expect(worldRotation(rig, "hips").angleTo(yaw(70))).toBeCloseTo(0, 6);
    expect(rig.joints.spine.node.quaternion.angleTo(yaw(15))).toBeCloseTo(0, 6);
    expect(worldRotation(rig, "head").angleTo(yaw(85))).toBeCloseTo(0, 6);

    solver.solve(turnedSample(0, 70), rig, 1 / 30);
    expect(worldRotation(rig, "spine").angleTo(yaw(70))).toBeCloseTo(0, 6);
  });

  it("keeps limb axes aligned with their tracked world directions after torso follow", () => {
    const rig = createDefaultCharacter();
    const solver = new Retargeting();
    solver.smoothing = 0;
    const sample = turnedSample(50, 36);
    solver.solve(sample, rig, 1 / 30);

    expect(rig.joints.spine.node.quaternion.angleTo(yaw(30))).toBeCloseTo(0, 6);
    for (const [joint, from, to] of [
      ["leftUpperArm", 11, 13],
      ["leftLowerArm", 13, 15],
      ["rightUpperLeg", 24, 26],
    ] as const) {
      const actual = rig.joints[joint].axis
        .clone()
        .applyQuaternion(worldRotation(rig, joint));
      const expected = point(sample.world[to])
        .sub(point(sample.world[from]))
        .normalize();
      expect(actual.angleTo(expected)).toBeCloseTo(0, 6);
    }
  });

  it("holds the extra yaw with weak or collapsed shoulders, then returns to neutral", () => {
    const rig = createDefaultCharacter();
    const solver = new Retargeting();
    solver.smoothing = 0;
    const turned = turnedSample(30);
    turned.world[11].visibility = 0.55;
    solver.solve(turned, rig, 1 / 30);
    expect(worldRotation(rig, "spine").angleTo(yaw(15))).toBeCloseTo(0, 6);

    const weak = turnedSample(-30);
    weak.world[12].visibility = 0.549;
    const collapsed = turnedSample(0);
    collapsed.world[11] = { x: 0, y: -0.85, z: 0, visibility: 1 };
    collapsed.world[12] = { x: 0, y: -0.45, z: 0, visibility: 1 };
    for (const unreliable of [weak, collapsed]) {
      expect(solver.solve(unreliable, rig, 1 / 30)).not.toBeNull();
      expect(worldRotation(rig, "spine").angleTo(yaw(15))).toBeCloseTo(0, 6);
    }

    solver.solve(turnedSample(0), rig, 1 / 30);
    expect(worldRotation(rig, "spine").angleTo(yaw(0))).toBeCloseTo(0, 6);
  });

  it("holds the whole pose when the pelvis frame is unavailable and clears remembered yaw on reset", () => {
    const rig = createDefaultCharacter();
    const solver = new Retargeting();
    solver.smoothing = 0;
    solver.solve(turnedSample(30), rig, 1 / 30);
    const missing = turnedSample(0);
    missing.world[11].x = Number.NaN;
    expect(solver.solve(missing, rig, 1 / 30)).toBeNull();
    expect(worldRotation(rig, "spine").angleTo(yaw(15))).toBeCloseTo(0, 6);

    solver.reset();
    const weak = turnedSample(30);
    weak.world[11].visibility = undefined;
    expect(solver.solve(weak, rig, 1 / 30)).not.toBeNull();
    expect(worldRotation(rig, "spine").angleTo(yaw(0))).toBeCloseTo(0, 6);
  });

  it("smooths toward a newly turned pose and converges for the spine and head", () => {
    const rig = createDefaultCharacter();
    const solver = new Retargeting();
    solver.solve(turnedSample(0), rig, 1 / 30);
    const turned = turnedSample(30);
    const target = yaw(15);
    solver.solve(turned, rig, 1 / 30);

    const remaining = worldRotation(rig, "spine").angleTo(target);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThan(yaw(0).angleTo(target));

    for (let step = 0; step < 80; step++) solver.solve(turned, rig, 1 / 30);
    expect(worldRotation(rig, "spine").angleTo(target)).toBeCloseTo(0, 6);
    expect(worldRotation(rig, "head").angleTo(target)).toBeCloseTo(0, 6);
  });
});
