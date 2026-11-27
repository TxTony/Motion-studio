/** Tests studio transitions without a camera, Vue, or WebGL. */
import { describe, it, expect, vi } from "vitest";
import { StudioSession } from "../src/application/StudioSession";
import type { SessionRuntime } from "../src/application/ports";
import {
  jointNames,
  type AnimationClip,
  type PoseSample,
  type RigPose,
} from "../src/domain/studio";

/** Provides a neutral pose independent of the graphics engine. */
function pose(): RigPose {
  return {
    root: [0, 0, 0],
    rotations: Object.fromEntries(
      jointNames.map((name) => [name, [0, 0, 0, 1]]),
    ) as RigPose["rotations"],
  };
}

/** Lets the test control when an operation resolves or rejects. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}

/** Creates mock adapters with a clock controlled by the test. */
function setup() {
  let now = 1000;
  let rigId = "test-rig";
  const clip: AnimationClip = {
    format: "motion-studio",
    version: 1,
    name: "Demo",
    rig: rigId,
    fps: 30,
    duration: 1,
    frames: [
      { time: 0, pose: pose() },
      { time: 1, pose: pose() },
    ],
  };
  const sample: PoseSample = {
    timestamp: now,
    world: [],
    image: [{ x: 0, y: 0, z: 0, visibility: 1 }],
  };
  const runtime: SessionRuntime = {
    get rigId() {
      return rigId;
    },
    startCamera: vi.fn(async () => true),
    stopCamera: vi.fn(),
    sample: vi.fn((): PoseSample | null | undefined => sample),
    solve: vi.fn(() => pose()),
    apply: vi.fn(),
    render: vi.fn(),
    resetRetarget: vi.fn(),
    configureRetarget: vi.fn(),
    resetView: vi.fn(),
    loadCharacter: vi.fn(async (_bytes, id) => {
      rigId = id;
    }),
    dispose: vi.fn(async () => {}),
    createDemoClip: vi.fn(() => clip),
  };
  const session = new StudioSession({
    runtime,
    now: () => now,
    interpolate: (a) => a,
  });
  return {
    session,
    runtime,
    sample,
    clip,
    advance: (ms: number) => {
      now += ms;
      session.tick(now);
    },
  };
}

describe("StudioSession", () => {
  it("replaces an error with an informational message and ignores reports after disposal", async () => {
    const { session } = setup();
    session.reportError("Import failed");
    expect(session.snapshot.status).toEqual({
      message: "Import failed",
      error: true,
    });

    const message = "JSON clip exported. Videos are never recorded.";
    session.reportInfo(message);
    expect(session.snapshot.status).toEqual({ message, error: false });

    await session.dispose();
    session.reportInfo("Late information");
    session.reportError("Late error");
    expect(session.snapshot.status).toEqual({ message, error: false });
  });

  it("starts in live demo mode with the demo clip selected", () => {
    const { session, runtime, advance, clip } = setup();
    expect(session.snapshot).toMatchObject({
      source: "demo",
      mode: "live",
      ready: true,
      selectedClip: clip,
      fps: 30,
      smoothing: 0.12,
      loop: true,
      speed: 1,
    });
    advance(0);
    expect(runtime.sample).toHaveBeenCalledWith(1000, "demo");
    expect(runtime.solve).toHaveBeenCalledOnce();
    expect(runtime.createDemoClip).toHaveBeenCalledOnce();
  });

  it("records the demo, replaces the library array, and selects the new clip", () => {
    const { session, runtime, advance } = setup();
    const previousClips = session.snapshot.clips;
    session.configure({ clipName: " Sample ", fps: 15 });
    session.startRecording();
    advance(0);
    advance(40);
    advance(30);
    expect(session.snapshot.recordingTime).toBe(0.07);
    session.stopRecording();

    expect(runtime.solve).toHaveBeenCalledTimes(3);
    expect(previousClips).toHaveLength(1);
    expect(session.snapshot.clips).toHaveLength(2);
    expect(session.snapshot.selectedClip).toMatchObject({
      name: "Sample",
      fps: 15,
    });
    expect(
      session.snapshot.selectedClip?.frames.map((frame) => frame.time),
    ).toEqual([0, 0.07]);
    expect(session.snapshot).toMatchObject({
      recording: false,
      mode: "playback",
      clipName: "Capture_02",
    });
  });

  it("blocks conflicting commands during recording", async () => {
    const { session, runtime, clip } = setup();
    session.startRecording();
    session.selectClip(clip);
    session.seek(0.5);
    session.togglePlay();
    session.useDemo();
    await session.startCamera();
    await session.importCharacter(
      new ArrayBuffer(0),
      "another-rig",
      "another.glb",
    );
    session.importClip({ ...clip, name: "Imported" });
    session.configure({
      clipName: "Other",
      facing: "environment",
      captureRoot: true,
      fps: 15,
      smoothing: 0.2,
    });

    expect(session.snapshot).toMatchObject({
      mode: "live",
      recording: true,
      clipName: "Capture_01",
      facing: "user",
      captureRoot: false,
      fps: 30,
      smoothing: 0.2,
      clips: [clip],
    });
    expect(runtime.configureRetarget).toHaveBeenLastCalledWith({
      smoothing: 0.2,
      captureRoot: false,
    });
    expect(runtime.startCamera).not.toHaveBeenCalled();
    expect(runtime.loadCharacter).not.toHaveBeenCalled();
  });

  it("keeps the clip at the five-minute limit even if no further frames arrive", () => {
    const { session, runtime, advance } = setup();
    session.startRecording();
    advance(0);
    advance(300_000);
    expect(session.snapshot.recording).toBe(true);
    vi.mocked(runtime.sample).mockReturnValue(undefined);
    advance(1);
    expect(session.snapshot.recording).toBe(false);
    expect(session.snapshot.selectedClip?.duration).toBe(300);
  });

  it("ignores a successful camera response after cancellation", async () => {
    const { session, runtime } = setup();
    const camera = deferred<boolean>();
    vi.mocked(runtime.startCamera).mockReturnValueOnce(camera.promise);
    const pending = session.startCamera();
    expect(session.snapshot.busy).toBe(true);
    session.useDemo();
    camera.resolve(true);
    await pending;
    expect(runtime.stopCamera).toHaveBeenCalledOnce();
    expect(session.snapshot).toMatchObject({
      source: "demo",
      busy: false,
      status: { error: false },
    });
  });

  it("ignores a late camera error while a second request is pending", async () => {
    const { session, runtime } = setup();
    const first = deferred<boolean>();
    const second = deferred<boolean>();
    vi.mocked(runtime.startCamera)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const oldRequest = session.startCamera();
    session.useDemo();
    session.configure({ facing: "environment" });
    const newRequest = session.startCamera();
    first.reject(new Error("Previous request"));
    await oldRequest;
    expect(session.snapshot).toMatchObject({
      busy: true,
      status: { error: false },
    });
    expect(runtime.stopCamera).toHaveBeenCalledOnce();

    second.resolve(true);
    await newRequest;
    expect(runtime.startCamera).toHaveBeenLastCalledWith("environment");
    expect(session.snapshot).toMatchObject({
      source: "camera",
      busy: false,
      ready: false,
    });
  });

  it("holds the overlay between frames, clears it without a body, and blocks recording after 750 ms", async () => {
    const { session, runtime, sample, advance } = setup();
    await session.startCamera();
    session.startRecording();
    expect(session.snapshot.recording).toBe(false);
    advance(0);
    expect(session.snapshot).toMatchObject({
      ready: true,
      sample,
      captureCaption: "1/33 joints visible",
    });
    vi.mocked(runtime.sample).mockReturnValue(undefined);
    advance(100);
    expect(session.snapshot.sample).toBe(sample);
    vi.mocked(runtime.sample).mockReturnValue(null);
    advance(650);
    expect(session.snapshot).toMatchObject({ ready: true, sample: null });
    advance(1);
    expect(session.snapshot).toMatchObject({
      ready: false,
      captureCaption: "Body out of view · holding last pose",
    });
    expect(runtime.apply).toHaveBeenCalledOnce();
    vi.mocked(runtime.sample).mockReturnValue(sample);
    advance(40);
    expect(session.snapshot.ready).toBe(true);
  });

  it("returns to demo mode and shows an error when the current camera request fails", async () => {
    const { session, runtime } = setup();
    vi.mocked(runtime.startCamera).mockRejectedValueOnce(
      new Error("Access denied"),
    );
    await session.startCamera();
    expect(session.snapshot).toMatchObject({
      source: "demo",
      ready: true,
      busy: false,
      status: { error: true },
    });
    expect(session.snapshot.status.message).toContain("Access denied");
  });

  it("keeps imported clips in the library and blocks playback for a different rig", () => {
    const { session, clip } = setup();
    const other = { ...clip, rig: "other" };
    session.selectClip(other);
    expect(session.snapshot).toMatchObject({
      mode: "live",
      selectedClip: clip,
      status: { error: true },
    });
    session.importClip(other);
    expect(session.snapshot.clips).toEqual([clip, other]);
    expect(session.snapshot.selectedClip).toBe(clip);
  });

  it("keeps playing when rewinding and pauses when scrubbing", () => {
    const { session, runtime, advance } = setup();
    session.togglePlay();
    session.setSpeed(2);
    session.toggleLoop();
    advance(100);
    expect(runtime.solve).not.toHaveBeenCalled();
    expect(session.snapshot).toMatchObject({
      mode: "playback",
      playing: true,
      loop: false,
      speed: 2,
      time: 0.2,
    });
    session.rewind();
    expect(session.snapshot).toMatchObject({ playing: true, time: 0 });
    session.seek(0.5);
    expect(session.snapshot).toMatchObject({ playing: false, time: 0.5 });
    session.live();
    expect(session.snapshot).toMatchObject({ mode: "live", playing: false });
  });

  it("blocks competing loads and clears selection after a successful GLB import", async () => {
    const { session, runtime, clip } = setup();
    const glb = deferred<void>();
    vi.mocked(runtime.loadCharacter).mockReturnValueOnce(glb.promise);
    const bytes = new ArrayBuffer(2);
    const pending = session.importCharacter(bytes, "glb-id", "character.glb");
    session.useDemo();
    await session.startCamera();
    await session.importCharacter(bytes, "second", "other.glb");
    expect(session.snapshot.busy).toBe(true);
    expect(runtime.loadCharacter).toHaveBeenCalledExactlyOnceWith(
      bytes,
      "glb-id",
    );
    expect(runtime.startCamera).not.toHaveBeenCalled();
    glb.resolve(undefined);
    await pending;
    expect(session.snapshot).toMatchObject({
      busy: false,
      mode: "live",
      selectedClip: null,
      time: 0,
      clips: [clip],
      characterName: "character.glb",
      characterKind: "Imported GLB character",
    });
  });

  it("keeps the current rig and selection when GLB loading fails", async () => {
    const { session, runtime, clip } = setup();
    vi.mocked(runtime.loadCharacter).mockRejectedValueOnce(
      new Error("Missing bone"),
    );
    await session.importCharacter(
      new ArrayBuffer(0),
      "glb-id",
      "character.glb",
    );
    expect(session.snapshot).toMatchObject({
      busy: false,
      characterName: "Default character",
      selectedClip: clip,
      status: { error: true },
    });
    expect(session.snapshot.status.message).toContain("Missing bone");
  });

  it("stops the camera and finishes recording when backgrounded", () => {
    const { session, runtime, advance } = setup();
    session.startRecording();
    advance(0);
    advance(40);
    session.suspend();
    expect(runtime.stopCamera).toHaveBeenCalled();
    expect(session.snapshot).toMatchObject({
      recording: false,
      source: "demo",
      mode: "live",
    });
    expect(session.snapshot.clips).toHaveLength(2);
  });

  it("disposes the runtime once and ignores commands and responses after disposal", async () => {
    const { session, runtime, advance } = setup();
    const camera = deferred<boolean>();
    vi.mocked(runtime.startCamera).mockReturnValueOnce(camera.promise);
    const pending = session.startCamera();
    await Promise.all([session.dispose(), session.dispose()]);
    camera.resolve(true);
    await pending;
    advance(40);
    session.startRecording();
    expect(runtime.dispose).toHaveBeenCalledOnce();
    expect(runtime.render).not.toHaveBeenCalled();
    expect(session.snapshot).toMatchObject({
      source: "demo",
      busy: false,
      recording: false,
    });
  });
});
