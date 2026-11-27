/** Draws the clip's four tracks and its current playhead position. */
import type { AnimationClip } from "../../domain/studio";
import { resizeCanvas } from "./canvas-size";

/** Redraws the selected clip and subsamples its keyframe markers for legibility. */
export function drawTimeline(
  canvas: HTMLCanvasElement,
  clip: AnimationClip | null,
  time: number,
): void {
  const size = resizeCanvas(canvas),
    ctx = canvas.getContext("2d");
  if (!size || !ctx) return;
  const [width, height] = size,
    duration = clip?.duration ?? 6;
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.font = "9px monospace";
  for (let i = 0; i <= 10; i++) {
    const x = (i * width) / 10;
    ctx.strokeStyle = "#343946";
    ctx.beginPath();
    ctx.moveTo(x, 23);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillStyle = "#828b9e";
    ctx.fillText(
      `${((duration * i) / 10).toFixed(1)}s`,
      Math.min(x + 3, width - 30),
      12,
    );
  }
  const colors = ["#729dce", "#6ab8a1", "#d6b879", "#b190d2"];
  for (let row = 0; row < 4; row++) {
    const y = 26 + row * 26;
    ctx.fillStyle = colors[row] + "18";
    ctx.fillRect(0, y, width, 21);
    ctx.strokeStyle = "#303642";
    ctx.beginPath();
    ctx.moveTo(0, y + 24);
    ctx.lineTo(width, y + 24);
    ctx.stroke();
    if (clip) {
      const stride = Math.max(1, Math.ceil(clip.frames.length / 60));
      ctx.fillStyle = colors[row];
      for (let i = 0; i < clip.frames.length; i += stride) {
        const x = (clip.frames[i].time / duration) * width;
        ctx.save();
        ctx.translate(x, y + 10);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      }
    }
  }
  const x = duration > 0 ? (time / duration) * width : 0;
  ctx.strokeStyle = "#f37e94";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, 18);
  ctx.lineTo(x, height);
  ctx.stroke();
  ctx.fillStyle = "#f37e94";
  ctx.beginPath();
  ctx.arc(x, 21, 4, 0, Math.PI * 2);
  ctx.fill();
}
