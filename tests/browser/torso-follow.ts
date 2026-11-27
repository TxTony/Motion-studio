/** Runs the real renderer and retargeter against reproducible shoulder turns without camera access. */
import { Euler, Quaternion, Vector3 } from "three";
import { CharacterRenderer } from "../../src/infrastructure/three/CharacterRenderer";
import { Retargeting } from "../../src/infrastructure/retargeting/Retargeting";
import {
  demoSample,
  point,
} from "../../src/infrastructure/retargeting/SkeletonMapping";

const container = document.querySelector<HTMLElement>("#scene")!;
const result = document.querySelector<HTMLOutputElement>("#result")!;
const renderer = new CharacterRenderer(container);
const solver = new Retargeting();
solver.smoothing = 0;
const up = new Vector3(0, 1, 0);

/** Rotates only upper-body capture points around the shoulder midpoint, keeping the pelvis fixed. */
function turnShoulders(degrees: number) {
  const sample = demoSample(0);
  const center = point(sample.world[11])
    .add(point(sample.world[12]))
    .multiplyScalar(0.5);
  const yaw = new Quaternion().setFromAxisAngle(up, (degrees * Math.PI) / 180);
  for (const index of [11, 12, 13, 14, 15, 16]) {
    const p = point(sample.world[index])
      .sub(center)
      .applyQuaternion(yaw)
      .add(center);
    sample.world[index] = { x: p.x, y: -p.y, z: -p.z, visibility: 1 };
  }
  return sample;
}

/** Reads actual rendered world yaw in degrees, including inherited parent rotations. */
function worldYaw(name: "hips" | "spine" | "head") {
  renderer.rig.root.updateMatrixWorld(true);
  const rotation = renderer.rig.joints[name].node.getWorldQuaternion(
    new Quaternion(),
  );
  return (new Euler().setFromQuaternion(rotation, "YXZ").y * 180) / Math.PI;
}

/** Applies one synthetic pose and reports measured angles against the feature's acceptance values. */
function showTurn(degrees: number) {
  const pose = solver.solve(turnShoulders(degrees), renderer.rig, 1 / 30);
  if (!pose) throw new Error("Synthetic torso frame must be valid.");
  renderer.apply(pose);
  const hips = worldYaw("hips"),
    spine = worldYaw("spine"),
    head = worldYaw("head");
  const expected =
    Math.sign(degrees) *
    Math.min(45, Math.max(0, Math.abs(degrees) - 10) * 0.75);
  const pass =
    Math.abs(hips) < 0.01 &&
    Math.abs(spine - expected) < 0.01 &&
    Math.abs(head - spine) < 0.01;
  result.textContent = `${pass ? "PASS" : "FAIL"} | shoulders ${degrees.toFixed(1)} deg | torso ${spine.toFixed(1)} deg | hips ${hips.toFixed(1)} deg | head ${head.toFixed(1)} deg`;
}

/** Responds to the fixture's explicit synthetic-angle buttons. */
function chooseTurn(event: Event) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button[data-angle]",
  );
  if (button) showTurn(Number(button.dataset.angle));
}

let frame = 0;
/** Keeps orbit controls and the WebGL scene responsive between synthetic samples. */
function render() {
  renderer.render();
  frame = requestAnimationFrame(render);
}
/** Releases fixture listeners, animation scheduling and WebGL resources on navigation. */
function dispose() {
  cancelAnimationFrame(frame);
  document.removeEventListener("click", chooseTurn);
  renderer.dispose();
}
document.addEventListener("click", chooseTurn);
window.addEventListener("pagehide", dispose, { once: true });
showTurn(0);
render();
