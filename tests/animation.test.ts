/** Tests clip validation and playback timing with standalone poses. */
import { describe, it, expect, vi } from "vitest";
import { AnimationRecorder } from "../src/domain/animation/AnimationRecorder";
import { AnimationPlayer } from "../src/domain/animation/AnimationPlayer";
import { AnimationSerializer } from "../src/domain/animation/AnimationSerializer";
import {
  jointNames,
  type AnimationClip,
  type RigPose,
} from "../src/domain/studio";
import { interpolateRigPose } from "../src/infrastructure/three/interpolateRigPose";

/** Builds a neutral pose with the given X translation. */
function pose(x = 0): RigPose {
  return {
    root: [x, 0, 0],
    rotations: Object.fromEntries(
      jointNames.map((n) => [n, [0, 0, 0, 1]]),
    ) as RigPose["rotations"],
  };
}
/** Provides two keyframes one second apart. */
function clip(): AnimationClip {
  return {
    format: "motion-studio",
    version: 1,
    name: "Test",
    rig: "test-v1",
    fps: 30,
    duration: 1,
    frames: [
      { time: 0, pose: pose() },
      { time: 1, pose: pose(2) },
    ],
  };
}
describe("AnimationRecorder", () => {
  it("samples poses without sharing mutable references", () => {
    const r = new AnimationRecorder(),
      p = pose();
    r.start("Sample", "test", 30, 1000);
    r.add(p, 1000);
    r.add(p, 1010);
    p.root[0] = 3;
    r.add(p, 1040);
    const c = r.stop()!;
    expect(c.frames).toHaveLength(2);
    expect(c.frames[0].pose.root[0]).toBe(0);
    expect(c.frames[1].time).toBe(0.04);
    expect(r.recording).toBe(false);
  });
  it("rejects clips with fewer than two poses and caps recording duration", () => {
    const r = new AnimationRecorder();
    r.start("", "rig", 30, 0);
    expect(r.stop()).toBeNull();
    r.start("", "rig", 30, 0);
    r.add(pose(), 0);
    expect(r.add(pose(), 300001)).toBe(false);
    expect(r.stop()).toBeNull();
  });
});
describe("AnimationPlayer", () => {
  it("passes the bracketing poses and blend fraction to the injected interpolator", () => {
    const animation = clip();
    const expectedPose = pose(42);
    const interpolate = vi.fn(() => expectedPose);
    const player = new AnimationPlayer(interpolate);
    player.load(animation);
    player.seek(0.25);

    expect(player.sample()).toBe(expectedPose);
    expect(interpolate).toHaveBeenCalledExactlyOnceWith(
      animation.frames[0].pose,
      animation.frames[1].pose,
      0.25,
    );
  });

  it("interpolates translation and rotation halfway through the clip", () => {
    const c = clip();
    c.frames[1].pose.rotations.head = [0, 1, 0, 0];
    const p = new AnimationPlayer(interpolateRigPose);
    p.load(c);
    p.seek(0.5);
    expect(p.sample()!.root[0]).toBe(1);
    expect(p.sample()!.rotations.head[1]).toBeCloseTo(Math.SQRT1_2);
  });
  it("handles looping, speed, pausing, and reaching the end with looping disabled", () => {
    const p = new AnimationPlayer(interpolateRigPose);
    p.load(clip());
    p.playing = true;
    p.speed = 2;
    p.update(0.6);
    expect(p.time).toBeCloseTo(0.2);
    p.playing = false;
    p.update(1);
    expect(p.time).toBeCloseTo(0.2);
    p.loop = false;
    p.playing = true;
    p.update(1);
    expect(p.time).toBe(1);
    expect(p.playing).toBe(false);
    p.seek(-1);
    expect(p.time).toBe(0);
    p.seek(10);
    expect(p.time).toBe(1);
  });
  it("holds the first pose before its timestamp", () => {
    const c = clip();
    c.frames[0].time = 0.2;
    const p = new AnimationPlayer(interpolateRigPose);
    p.load(c);
    expect(p.sample()!.root).toEqual([0, 0, 0]);
  });
});
describe("AnimationSerializer", () => {
  it("rejects a JSON clip with an invalid pose value", () => {
    const animation = clip();
    const frames: unknown[] = [animation.frames[0], { time: 1, pose: "pose" }];
    const input: unknown = { ...animation, frames };

    expect(() => AnimationSerializer.parse(JSON.stringify(input))).toThrow(
      "Invalid clip",
    );
  });

  it("round-trips a clip without data loss", () => {
    expect(
      AnimationSerializer.parse(AnimationSerializer.stringify(clip())),
    ).toEqual(clip());
  });
  it.each([
    "version",
    "quaternion",
    "ordering",
    "duration",
    "missing",
    "nonfinite",
  ])("rejects invalid %s", (variant) => {
    const c = clip();
    if (variant === "version") c.version = 2 as 1;
    if (variant === "quaternion")
      c.frames[0].pose.rotations.head = [0, 0, 0, 0];
    if (variant === "ordering") c.frames[1].time = 0;
    if (variant === "duration") c.duration = 1000;
    if (variant === "missing")
      delete (c.frames[0].pose.rotations as Partial<RigPose["rotations"]>).hips;
    if (variant === "nonfinite") c.frames[0].pose.root[0] = Infinity;
    expect(() => AnimationSerializer.parse(JSON.stringify(c))).toThrow();
  });
});
