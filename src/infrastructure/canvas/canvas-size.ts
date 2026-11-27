/** Ajuste les canvases 2D au pixel ratio sans exposer leur contexte à la session. */
/** Retourne les dimensions CSS non nulles, ou null pour une surface masquée. */
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
