/** Vérifie les frontières de données et la lecture temporelle avec des poses indépendantes. */
import { describe, it, expect } from "vitest";
import { AnimationRecorder } from "../src/AnimationRecorder";
import { AnimationPlayer } from "../src/AnimationPlayer";
import { AnimationSerializer } from "../src/AnimationSerializer";
import { jointNames, type AnimationClip, type RigPose } from "../src/types";

function pose(x = 0): RigPose {
  return {
    root: [x, 0, 0],
    rotations: Object.fromEntries(
      jointNames.map((n) => [n, [0, 0, 0, 1]]),
    ) as RigPose["rotations"],
  };
}
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
  it("échantillonne sans conserver de références mutables", () => {
    const r = new AnimationRecorder(),
      p = pose();
    r.start("Essai", "test", 30, 1000);
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
  it("refuse un clip vide ou une seule pose et borne la durée", () => {
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
  it("interpole une translation et une rotation à mi-parcours", () => {
    const c = clip();
    c.frames[1].pose.rotations.head = [0, 1, 0, 0];
    const p = new AnimationPlayer();
    p.load(c);
    p.seek(0.5);
    expect(p.sample()!.root[0]).toBe(1);
    expect(p.sample()!.rotations.head[1]).toBeCloseTo(Math.SQRT1_2);
  });
  it("gère boucle, vitesse, pause et fin sans boucle", () => {
    const p = new AnimationPlayer();
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
  it("maintient la première pose avant son premier timestamp", () => {
    const c = clip();
    c.frames[0].time = 0.2;
    const p = new AnimationPlayer();
    p.load(c);
    expect(p.sample()!.root).toEqual([0, 0, 0]);
  });
});
describe("AnimationSerializer", () => {
  it("effectue un aller-retour sans perte", () => {
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
  ])("rejette %s", (variant) => {
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
