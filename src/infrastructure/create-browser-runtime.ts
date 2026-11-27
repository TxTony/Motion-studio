/** Wires browser adapters to the session ports without Vue state. */
import type { SessionRuntime } from "../application/ports";
import { MotionCapture } from "./capture/MotionCapture";
import { Retargeting } from "./retargeting/Retargeting";
import { demoSample } from "./retargeting/SkeletonMapping";
import type { CharacterRenderer } from "./three/CharacterRenderer";
import { createDemoClip } from "./three/create-demo-clip";

/** Connects the video element and renderer. The viewer owns and disposes its renderer. */
export function createBrowserRuntime(
  video: HTMLVideoElement,
  renderer: CharacterRenderer,
): SessionRuntime {
  const capture = new MotionCapture(video),
    retarget = new Retargeting();
  return {
    get rigId() {
      return renderer.rig.id;
    },
    async startCamera(facing) {
      await capture.start(facing);
      return capture.active;
    },
    stopCamera() {
      capture.stop();
    },
    sample(now, source) {
      return source === "demo" ? demoSample(now / 1000) : capture.sample(now);
    },
    solve(sample, dt) {
      return retarget.solve(sample, renderer.rig, dt);
    },
    apply(pose) {
      renderer.apply(pose);
    },
    render() {
      renderer.render();
    },
    resetRetarget() {
      retarget.reset();
    },
    configureRetarget(options) {
      retarget.smoothing = options.smoothing;
      retarget.captureRoot = options.captureRoot;
    },
    resetView() {
      renderer.resetView();
    },
    async loadCharacter(bytes, id) {
      await renderer.loadGLB(bytes);
      renderer.rig.id = id;
    },
    createDemoClip,
    async dispose() {
      await capture.dispose();
    },
  };
}
