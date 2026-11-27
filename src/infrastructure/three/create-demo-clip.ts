/** Builds the initial synthetic clip using the default rig and retargeting solver. */
import { Mesh } from "three";
import { createDefaultCharacter } from "./CharacterRenderer";
import { Retargeting } from "../retargeting/Retargeting";
import { demoSample } from "../retargeting/SkeletonMapping";
import type { AnimationClip } from "../../domain/studio";

/** Generates six reproducible seconds of synthetic motion and releases the temporary rig. */
export function createDemoClip(): AnimationClip {
  const rig = createDefaultCharacter(),
    solver = new Retargeting();
  solver.smoothing = 0;
  const clip: AnimationClip = {
    format: "motion-studio",
    version: 1,
    name: "Workshop · Demo",
    rig: rig.id,
    fps: 30,
    duration: 6,
    frames: [],
  };
  for (let i = 0; i <= 180; i++) {
    const pose = solver.solve(demoSample(i / 30), rig, 1 / 30);
    if (pose) clip.frames.push({ time: i / 30, pose: structuredClone(pose) });
  }
  rig.root.traverse((node) => {
    if (node instanceof Mesh) {
      node.geometry.dispose();
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      materials.forEach((material) => material.dispose());
    }
  });
  return clip;
}
