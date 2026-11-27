/** Converts world directions to local rig rotations and applies temporal smoothing. */
import { Quaternion, Vector3 } from "three";
import type { CharacterRig } from "../three/CharacterRenderer";
import {
  limbPairs,
  point,
  shoulderYawInPelvis,
  torsoOrientation,
  visible,
} from "./SkeletonMapping";
import { jointNames, type PoseSample, type RigPose } from "../../domain/studio";
import { torsoFollowYaw } from "../../domain/torso-follow";

const pelvisUpAxis = new Vector3(0, 1, 0);

export class Retargeting {
  smoothing = 0.12;
  captureRoot = false;
  private baseline: Vector3 | null = null;
  private previous: RigPose | null = null;
  private additionalTorsoYaw = 0;
  /** Resets smoothing, the root origin, and remembered torso yaw when tracking is reset. */
  reset() {
    this.baseline = null;
    this.previous = null;
    this.additionalTorsoYaw = 0;
  }
  /** Uses a time delta in seconds. A time constant of zero disables smoothing. Returns null if the hips are occluded. */
  solve(sample: PoseSample, rig: CharacterRig, dt: number): RigPose | null {
    const pelvis = torsoOrientation(sample.world);
    if (!pelvis) return null;
    const shoulderYaw = shoulderYawInPelvis(sample.world, pelvis);
    if (shoulderYaw !== null)
      this.additionalTorsoYaw = torsoFollowYaw(shoulderYaw);
    const torso = pelvis
      .clone()
      .multiply(
        new Quaternion().setFromAxisAngle(
          pelvisUpAxis,
          this.additionalTorsoYaw,
        ),
      );
    const rotations = {} as RigPose["rotations"];
    const alpha =
      this.smoothing <= 0
        ? 1
        : 1 - Math.exp(-Math.min(0.1, Math.max(0, dt)) / this.smoothing);
    rig.root.updateMatrixWorld(true);
    for (const name of jointNames) {
      const joint = rig.joints[name];
      let desired: Quaternion;
      const pair = limbPairs[name];
      if (pair && visible(sample.world, pair)) {
        const direction = point(sample.world[pair[1]]).sub(
          point(sample.world[pair[0]]),
        );
        if (direction.lengthSq() < 0.00001) {
          rotations[name] =
            this.previous?.rotations[name] ?? joint.node.quaternion.toArray();
          continue;
        }
        const rest = joint.axis.clone().applyQuaternion(joint.bindWorld);
        desired = new Quaternion()
          .setFromUnitVectors(rest.normalize(), direction.normalize())
          .multiply(joint.bindWorld);
      } else if (!pair) {
        desired = name === "hips" ? pelvis : torso;
      } else {
        rotations[name] =
          this.previous?.rotations[name] ?? joint.node.quaternion.toArray();
        continue;
      }
      const parent =
        joint.node.parent?.getWorldQuaternion(new Quaternion()) ??
        new Quaternion();
      const local = parent.invert().multiply(desired);
      if (this.previous)
        local.copy(
          new Quaternion()
            .fromArray(this.previous.rotations[name])
            .slerp(local.clone(), alpha),
        );
      joint.node.quaternion.copy(local);
      joint.node.updateMatrixWorld(true);
      rotations[name] = local.toArray();
    }
    const hip = new Vector3(
      (sample.image[23].x + sample.image[24].x) / 2,
      (sample.image[23].y + sample.image[24].y) / 2,
      0,
    );
    this.baseline ??= hip.clone();
    const root = this.captureRoot
      ? new Vector3(
          (hip.x - this.baseline.x) * 3,
          -(hip.y - this.baseline.y) * 3,
          0,
        )
      : new Vector3();
    if (this.previous)
      root.copy(new Vector3().fromArray(this.previous.root).lerp(root, alpha));
    this.previous = { root: root.toArray(), rotations };
    return this.previous;
  }
}
