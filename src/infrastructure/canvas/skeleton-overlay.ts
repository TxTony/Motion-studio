/** Draws capture landmarks inside the same fitted rectangle as the viewer's video. */
import type { PoseSample } from "../../domain/studio";
import { connections } from "../retargeting/SkeletonMapping";
import { resizeCanvas } from "./canvas-size";

/** Clears the canvas and projects the visible segments and joints. */
export function drawSkeleton(
  canvas: HTMLCanvasElement,
  sample: PoseSample | null,
  ratio: number,
): void {
  const size = resizeCanvas(canvas),
    ctx = canvas.getContext("2d");
  if (!size || !ctx) return;
  const [width, height] = size;
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!sample) return;
  const vw = Math.min(width, height * ratio),
    vh = vw / ratio,
    ox = (width - vw) / 2,
    oy = (height - vh) / 2;
  /** Projects a normalized point to CSS pixels within the video bounds. */
  const position = (index: number): [number, number] => [
    ox + sample.image[index].x * vw,
    oy + sample.image[index].y * vh,
  ];
  /** Checks whether a landmark passes the visibility threshold. */
  const visible = (index: number) =>
    (sample.image[index]?.visibility ?? 0) > 0.5;
  ctx.lineWidth = 2;
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
    ctx.arc(...position(index), 3.4, 0, Math.PI * 2);
    ctx.fillStyle = "#d3edb0";
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
