/** Sizes 2D canvases for the device pixel ratio. */
/** Returns nonzero dimensions in CSS pixels or null if the surface is hidden. */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
): [number, number] | null {
  const width = canvas.clientWidth,
    height = canvas.clientHeight,
    dpr = Math.min(devicePixelRatio, 2);
  if (!width || !height) return null;
  if (
    canvas.width !== Math.round(width * dpr) ||
    canvas.height !== Math.round(height * dpr)
  ) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  return [width, height];
}
