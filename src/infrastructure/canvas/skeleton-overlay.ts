/** Draws image-space landmarks at native video resolution; CSS fits video and overlay together. */
import type { PoseSample } from "../../domain/studio";
import { connections } from "../retargeting/SkeletonMapping";

/** Clears the canvas and projects the visible segments and joints. */
export function drawSkeleton(
  canvas: HTMLCanvasElement,
  sample: PoseSample | null,
  size: { width: number; height: number },
): void {
  const { width, height } = size;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!sample) return;
  /** Projects normalized image coordinates directly into source video pixels. */
  const position = (index: number): [number, number] => [
    sample.image[index].x * width,
    sample.image[index].y * height,
  ];
  /** Excludes uncertain, out-of-frame and invalid joints from the overlay. */
  const visible = (index: number) => {
    const point = sample.image[index];
    return (
      point !== undefined &&
      (point.visibility ?? 0) >= 0.55 &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= 0 &&
      point.x <= 1 &&
      point.y >= 0 &&
      point.y <= 1
    );
  };
  ctx.lineWidth = Math.max(2, width / 320);
  ctx.strokeStyle = "#b6d889";
  ctx.shadowColor = "#99c267";
  ctx.shadowBlur = 5;
  for (const [a, b] of connections) {
    if (!visible(a) || !visible(b)) continue;
    ctx.beginPath();
    ctx.moveTo(...position(a));
    ctx.lineTo(...position(b));
    ctx.stroke();
  }
  for (const index of new Set(connections.flat())) {
    if (!visible(index)) continue;
    ctx.beginPath();
    ctx.arc(...position(index), Math.max(3.4, width / 190), 0, Math.PI * 2);
    ctx.fillStyle = "#d3edb0";
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
