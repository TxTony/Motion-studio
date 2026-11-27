/** Caractérise les frontières de fichiers sans caméra ni téléchargement réel. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readAnimationFile,
  readCharacterFile,
} from "../src/infrastructure/files/studio-files";
afterEach(() => vi.unstubAllGlobals());
describe("adaptateurs fichiers", () => {
  it("refuse le JSON trop grand avant lecture", async () => {
    const text = vi.fn();
    await expect(
      readAnimationFile({ size: 20_000_001, text } as unknown as File),
    ).rejects.toThrow("20 Mo");
    expect(text).not.toHaveBeenCalled();
  });
  it("refuse le GLB trop grand avant lecture", async () => {
    const arrayBuffer = vi.fn();
    await expect(
      readCharacterFile({ size: 30_000_001, arrayBuffer } as unknown as File),
    ).rejects.toThrow("30 Mo");
    expect(arrayBuffer).not.toHaveBeenCalled();
  });
  it("valide les données JSON avant de les rendre à la session", async () => {
    await expect(
      readAnimationFile({ size: 2, text: async () => "{}" } as unknown as File),
    ).rejects.toThrow("Clip invalide");
  });
  it("identifie les octets GLB par un SHA-256 et conserve leur nom local", async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer,
      digest = vi.fn(async () => new Uint8Array(32).fill(10).buffer);
    vi.stubGlobal("crypto", { subtle: { digest } });
    const result = await readCharacterFile({
      name: "goblin.glb",
      size: 3,
      arrayBuffer: async () => bytes,
    } as unknown as File);
    expect(result.id).toBe("glb-" + "0a".repeat(32));
    expect(result.name).toBe("goblin.glb");
    expect(result.bytes).toBe(bytes);
    expect(digest).toHaveBeenCalledWith("SHA-256", bytes);
  });
});
