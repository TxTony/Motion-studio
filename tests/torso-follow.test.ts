/** Tests the numeric torso response independently of any rig or coordinate system. */
import { describe, expect, it } from "vitest";
import { torsoFollowYaw } from "../src/domain/torso-follow";

/** Converts readable fixture angles into the response function's radian input. */
function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

describe("torsoFollowYaw", () => {
  it.each([-10, -5, 0, 5, 10])("holds neutral at %i degrees", (degrees) => {
    expect(torsoFollowYaw(radians(degrees))).toBe(0);
  });

  it.each([
    [-30, -15],
    [-10.001, -0.00075],
    [10.001, 0.00075],
    [30, 15],
  ])("responds continuously to excess yaw at %f degrees", (input, expected) => {
    expect(torsoFollowYaw(radians(input))).toBeCloseTo(radians(expected), 10);
  });

  it.each([-180, -70, 70, 180])(
    "caps torso yaw at %i degrees of shoulder yaw",
    (degrees) => {
      expect(torsoFollowYaw(radians(degrees))).toBeCloseTo(
        radians(Math.sign(degrees) * 45),
      );
    },
  );
});
