/** Adaptateur local des fichiers : bornes, identification GLB et téléchargement JSON. */
import { AnimationSerializer } from "../../domain/animation/AnimationSerializer";
import type { AnimationClip } from "../../domain/studio";

export interface CharacterFile {
  bytes: ArrayBuffer;
  id: string;
  name: string;
}

/** Lit uniquement les JSON sous 20 Mo puis délègue la validation au domaine. */
export async function readAnimationFile(file: File): Promise<AnimationClip> {
  if (file.size > 20_000_000)
    throw new Error("Fichier trop volumineux (20 Mo maximum).");
  return AnimationSerializer.parse(await file.text());
}
/** Identifie un GLB par son contenu sans transmettre le fichier à un serveur. */
export async function readCharacterFile(file: File): Promise<CharacterFile> {
  if (file.size > 30_000_000)
    throw new Error("GLB trop volumineux (30 Mo maximum).");
  const bytes = await file.arrayBuffer(),
    hash = await crypto.subtle.digest("SHA-256", bytes);
  const id =
    "glb-" +
    Array.from(new Uint8Array(hash))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  return { bytes, id, name: file.name };
}
/** Télécharge la représentation JSON validée et libère son URL après le clic navigateur. */
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
/** Frontière prévue pour un futur export GLTF ; aucune implémentation GLTF n’est annoncée. */
export interface AnimationExportAdapter {
  export(clip: AnimationClip): Promise<Blob>;
}
