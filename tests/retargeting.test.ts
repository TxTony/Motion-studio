/** Tests coordinate conversion, occlusion, and smoothing on a procedural rig without WebGL. */
import { describe, it, expect } from "vitest";
import { Quaternion } from "three";
import { createDefaultCharacter } from "../src/infrastructure/three/CharacterRenderer";
import { Retargeting } from "../src/infrastructure/retargeting/Retargeting";
import {
  demoSample,
  torsoOrientation,
  point,
} from "../src/infrastructure/retargeting/SkeletonMapping";
import { jointNames } from "../src/domain/studio";

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
