/** Formate les durées du studio ; la valeur temporelle reste détenue par la session. */
/** Affiche minutes, secondes et centièmes pour les transports et l’enregistrement. */
export function timecode(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
}
