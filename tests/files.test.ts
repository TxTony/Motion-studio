/** Characterizes file boundaries and archived default-rig compatibility without real downloads. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readAnimationFile,
  readCharacterFile,
} from "../src/infrastructure/files/studio-files";
import { defaultCharacterRigId } from "../src/infrastructure/characters/default-character-identity";
import {
  jointNames,
  type AnimationClip,
  type RigPose,
} from "../src/domain/studio";

/** Builds a minimal version-one clip whose rig identifier belongs to the caller. */
function createClip(rig: string): AnimationClip {
  const pose: RigPose = {
    root: [0, 0, 0],
    rotations: Object.fromEntries(
      jointNames.map((name) => [name, [0, 0, 0, 1]]),
    ) as RigPose["rotations"],
  };
  return {
    format: "motion-studio",
    version: 1,
    name: "Sample",
    rig,
    fps: 30,
    duration: 1,
    frames: [
      { time: 0, pose },
      { time: 1, pose },
    ],
  };
}
/** Provides the local file boundary with a serialized fixture, without browser File APIs. */
function clipFile(clip: AnimationClip): File {
  const json = JSON.stringify(clip);
  return { size: json.length, text: async () => json } as File;
}
afterEach(() => vi.unstubAllGlobals());
describe("file adapters", () => {
  it("rejects oversized JSON before reading it", async () => {
    const text = vi.fn();
    await expect(
      readAnimationFile({ size: 20_000_001, text } as unknown as File),
    ).rejects.toThrow("20 MB");
    expect(text).not.toHaveBeenCalled();
  });
  it("rejects oversized GLB before reading it", async () => {
    const arrayBuffer = vi.fn();
    await expect(
      readCharacterFile({ size: 30_000_001, arrayBuffer } as unknown as File),
    ).rejects.toThrow("30 MB");
    expect(arrayBuffer).not.toHaveBeenCalled();
  });
  it("validates decoded JSON before returning it to the session", async () => {
    await expect(
      readAnimationFile({ size: 2, text: async () => "{}" } as unknown as File),
    ).rejects.toThrow("Invalid clip");
  });
  it("identifies GLB bytes with SHA-256 and preserves the local filename", async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer,
      digest = vi.fn(async () => new Uint8Array(32).fill(10).buffer);
    vi.stubGlobal("crypto", { subtle: { digest } });
    const result = await readCharacterFile({
      name: "character.glb",
      size: 3,
      arrayBuffer: async () => bytes,
    } as unknown as File);
    expect(result.id).toBe("glb-" + "0a".repeat(32));
    expect(result.name).toBe("character.glb");
    expect(result.bytes).toBe(bytes);
    expect(digest).toHaveBeenCalledWith("SHA-256", bytes);
  });
  it("migrates a recognized archived default rig without changing its poses", async () => {
    const fingerprint =
      "add6946e85a2b1e4c646992f16ca8970b0ede58434e1c9577aea0126d58a3846";
    const hash = Uint8Array.from(fingerprint.match(/../g)!, (value) =>
      parseInt(value, 16),
    ).buffer;
    const digest = vi.fn(async () => hash);
    vi.stubGlobal("crypto", { subtle: { digest } });
    const clip = createClip("archived-default-v1"),
      result = await readAnimationFile(clipFile(clip));
    expect(result.rig).toBe(defaultCharacterRigId);
    expect(result.frames).toEqual(clip.frames);
    expect(result.duration).toBe(clip.duration);
    expect(digest).toHaveBeenCalledWith(
      "SHA-256",
      new TextEncoder().encode(clip.rig),
    );
  });
  it("does not reinterpret unrelated or custom GLB rig identifiers", async () => {
    const digest = vi.fn(async () => new Uint8Array(32).buffer);
    vi.stubGlobal("crypto", { subtle: { digest } });
    expect(
      (await readAnimationFile(clipFile(createClip("unrelated-rig-v1")))).rig,
    ).toBe("unrelated-rig-v1");
    expect(
      (await readAnimationFile(clipFile(createClip("glb-custom")))).rig,
    ).toBe("glb-custom");
    expect(digest).toHaveBeenCalledTimes(1);
  });
  it("keeps the current default identifier without a migration lookup", async () => {
    const digest = vi.fn();
    vi.stubGlobal("crypto", { subtle: { digest } });
    expect(
      (await readAnimationFile(clipFile(createClip(defaultCharacterRigId))))
        .rig,
    ).toBe(defaultCharacterRigId);
    expect(digest).not.toHaveBeenCalled();
  });
});
