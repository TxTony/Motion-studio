/** Adapts Three.js vector and quaternion operations to the playback interpolation port. */
import { Quaternion, Vector3 } from "three";
import { jointNames, type RigPose } from "../../domain/studio";

/** Returns a new pose using lerp for the root and slerp for local rotations. */
export function interpolateRigPose(a: RigPose, b: RigPose, t: number): RigPose {
  const rotations = {} as RigPose["rotations"];
  for (const name of jointNames)
    rotations[name] = new Quaternion()
      .fromArray(a.rotations[name])
      .slerp(new Quaternion().fromArray(b.rotations[name]), t)
      .toArray();
  return {
    root: new Vector3()
      .fromArray(a.root)
      .lerp(new Vector3().fromArray(b.root), t)
      .toArray(),
    rotations,
  };
}
