/** Maps relative shoulder yaw to the additional torso yaw in radians. */

const deadZoneRadians = (10 * Math.PI) / 180;
const excessYawGain = 0.75;
const maximumYawRadians = (45 * Math.PI) / 180;

/** Returns signed torso yaw in radians for a finite shoulder yaw in radians. */
export function torsoFollowYaw(shoulderYaw: number): number {
  const excess = Math.abs(shoulderYaw) - deadZoneRadians;
  if (excess <= 0) return 0;
  return (
    Math.sign(shoulderYaw) * Math.min(excess * excessYawGain, maximumYawRadians)
  );
}
