/** Produit le clip initial synthétique en réutilisant le rig et le solveur de la référence. */
import { Mesh } from "three";
import { createGoblin } from "./CharacterRenderer";
import { Retargeting } from "../retargeting/Retargeting";
import { demoSample } from "../retargeting/SkeletonMapping";
import type { AnimationClip } from "../../domain/studio";

/** Capture six secondes déterministes, sans enregistrer de mouvement humain ni conserver le rig temporaire. */
export function createDemoClip(): AnimationClip {
  const rig = createGoblin(),
    solver = new Retargeting();
  solver.smoothing = 0;
  const clip: AnimationClip = {
    format: "motion-studio",
    version: 1,
    name: "Atelier · Démo",
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
