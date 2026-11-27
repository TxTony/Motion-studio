/** Verifies image-space overlay drawing independently of viewport shape and display density. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drawSkeleton } from "../src/infrastructure/canvas/skeleton-overlay";
import type { PoseSample } from "../src/domain/studio";

/** Creates a canvas double whose viewport deliberately differs from the portrait video. */
function surface() {
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  };
  const canvas = {
    width: 300,
    height: 150,
    clientWidth: 600,
    clientHeight: 300,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx };
}
/** Makes two visible shoulders and hides all remaining landmarks. */
function sample(): PoseSample {
  const image = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0,
  }));
  image[11] = { x: 0.25, y: 0.25, z: 0, visibility: 0.9 };
  image[12] = { x: 0.75, y: 0.25, z: 0, visibility: 0.9 };
  return { timestamp: 0, image, world: [] };
}
beforeEach(() => vi.stubGlobal("devicePixelRatio", 2));
afterEach(() => vi.unstubAllGlobals());
describe("native video skeleton overlay", () => {
  it.each([
    { width: 720, height: 960 },
    { width: 1280, height: 720 },
  ])("draws normalized shoulders in native pixels for %o", (size) => {
    const { canvas, ctx } = surface();
    drawSkeleton(canvas, sample(), size);
    expect([canvas.width, canvas.height]).toEqual([size.width, size.height]);
    expect(ctx.moveTo).toHaveBeenCalledWith(
      size.width * 0.25,
      size.height * 0.25,
    );
    expect(ctx.lineTo).toHaveBeenCalledWith(
      size.width * 0.75,
      size.height * 0.25,
    );
    expect(ctx.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
  });
  it("clears a lost pose without retaining old joints", () => {
    const { canvas, ctx } = surface();
    drawSkeleton(canvas, null, { width: 720, height: 960 });
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 720, 960);
    expect(ctx.arc).not.toHaveBeenCalled();
  });
  it("rejects uncertain and non-finite landmarks", () => {
    const { canvas, ctx } = surface(),
      pose = sample();
    pose.image[11].visibility = 0.52;
    pose.image[12].x = NaN;
    drawSkeleton(canvas, pose, { width: 720, height: 960 });
    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(ctx.arc).not.toHaveBeenCalled();
  });
});
