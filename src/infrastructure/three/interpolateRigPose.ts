/** Adapte les opérations vectorielles et quaternion de Three.js au port de lecture des poses. */
import { Quaternion, Vector3 } from "three";
import { jointNames, type RigPose } from "../../domain/studio";

/** Produit une nouvelle pose via lerp pour la racine et slerp pour les rotations locales. */
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
