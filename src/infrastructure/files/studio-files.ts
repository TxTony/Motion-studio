/** Adapts local files: size limits, archived rig compatibility, GLB identity and JSON downloads. */
import { AnimationSerializer } from "../../domain/animation/AnimationSerializer";
import type { AnimationClip } from "../../domain/studio";
import { defaultCharacterRigId } from "../characters/default-character-identity";

export interface CharacterFile {
  bytes: ArrayBuffer;
  id: string;
  name: string;
}
const legacyDefaultRigFingerprint =
  "add6946e85a2b1e4c646992f16ca8970b0ede58434e1c9577aea0126d58a3846";

/** Hashes external identity data using the browser's SHA-256 implementation. */
async function sha256Hex(bytes: BufferSource): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

/** Maps only the archived default-rig identity; unrelated and custom GLB rigs keep their identifiers. */
async function normalizeDefaultRig(
  clip: AnimationClip,
): Promise<AnimationClip> {
  if (clip.rig === defaultCharacterRigId || clip.rig.startsWith("glb-"))
    return clip;
  const fingerprint = await sha256Hex(new TextEncoder().encode(clip.rig));
  return fingerprint === legacyDefaultRigFingerprint
    ? { ...clip, rig: defaultCharacterRigId }
    : clip;
}

/** Reads JSON files up to 20 MB, validates them and adapts recognized archived rig metadata. */
export async function readAnimationFile(file: File): Promise<AnimationClip> {
  if (file.size > 20_000_000)
    throw new Error("File too large (20 MB maximum).");
  return normalizeDefaultRig(AnimationSerializer.parse(await file.text()));
}

/** Identifies a self-contained GLB by content without sending it to a server. */
export async function readCharacterFile(file: File): Promise<CharacterFile> {
  if (file.size > 30_000_000) throw new Error("GLB too large (30 MB maximum).");
  const bytes = await file.arrayBuffer(),
    id = "glb-" + (await sha256Hex(bytes));
  return { bytes, id, name: file.name };
}

/** Downloads validated JSON and releases its temporary URL after the browser click. */
export function downloadAnimation(clip: AnimationClip): void {
  const url = URL.createObjectURL(
    new Blob([AnimationSerializer.stringify(clip)], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${clip.name.replace(/[^\p{L}\p{N}_-]/gu, "_")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reserved boundary for a future GLTF animation exporter; no GLTF export is implemented today. */
export interface AnimationExportAdapter {
  export(clip: AnimationClip): Promise<Blob>;
}
