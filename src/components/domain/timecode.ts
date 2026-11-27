/** Formats studio durations while the session retains ownership of time. */
/** Displays minutes, seconds and hundredths for transport and recording. */
export function timecode(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(2).padStart(5, "0")}`;
}
