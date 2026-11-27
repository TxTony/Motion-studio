/** Vérifie les transitions du studio sans caméra, Vue ni contexte WebGL. */
import { describe, it, expect, vi } from "vitest";
import { StudioSession } from "../src/application/StudioSession";
import type { SessionRuntime } from "../src/application/ports";
import {
  jointNames,
  type AnimationClip,
  type PoseSample,
  type RigPose,
} from "../src/domain/studio";

/** Fournit une pose neutre indépendante du moteur graphique. */
function pose(): RigPose {
  return {
    root: [0, 0, 0],
    rotations: Object.fromEntries(
      jointNames.map((name) => [name, [0, 0, 0, 1]]),
    ) as RigPose["rotations"],
  };
}

/** Maintient une opération en attente jusqu’à la réponse dictée par le scénario. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((success, failure) => {
    resolve = success;
    reject = failure;
  });
  return { promise, resolve, reject };
}

/** Simule les adaptateurs avec une horloge contrôlable par le scénario. */
function setup() {
  let now = 1000;
  let rigId = "goblin";
  const clip: AnimationClip = {
    format: "motion-studio",
    version: 1,
    name: "Démo",
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
  it("remplace une erreur par une information et ignore les messages après destruction", async () => {
    const { session } = setup();
    session.reportError("Import refusé");
    expect(session.snapshot.status).toEqual({
      message: "Import refusé",
      error: true,
    });

    const message =
      "Clip JSON exporté. Les vidéos ne sont jamais enregistrées.";
    session.reportInfo(message);
    expect(session.snapshot.status).toEqual({ message, error: false });

    await session.dispose();
    session.reportInfo("Information tardive");
    session.reportError("Erreur tardive");
    expect(session.snapshot.status).toEqual({ message, error: false });
  });

  it("démarre en démo temps réel avec le clip de démonstration sélectionné", () => {
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

  it("enregistre la démo et sélectionne le nouveau clip dans une nouvelle liste", () => {
    const { session, runtime, advance } = setup();
    const previousClips = session.snapshot.clips;
    session.configure({ clipName: " Essai ", fps: 15 });
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
      name: "Essai",
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

  it("bloque les changements incompatibles pendant une capture", async () => {
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
      clipName: "Autre",
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

  it("conserve le clip à la limite de cinq minutes, même sans nouvelle image ensuite", () => {
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

  it("ignore un succès caméra arrivé après annulation", async () => {
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

  it("ignore une erreur caméra tardive pendant une seconde demande", async () => {
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
    first.reject(new Error("Ancienne demande"));
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

  it("conserve le squelette sans nouvelle image, l’efface sans corps et bloque après 750 ms", async () => {
    const { session, runtime, sample, advance } = setup();
    await session.startCamera();
    session.startRecording();
    expect(session.snapshot.recording).toBe(false);
    advance(0);
    expect(session.snapshot).toMatchObject({
      ready: true,
      sample,
      captureCaption: "1/33 articulations visibles",
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
      captureCaption: "Corps perdu · pose maintenue",
    });
    expect(runtime.apply).toHaveBeenCalledOnce();
    vi.mocked(runtime.sample).mockReturnValue(sample);
    advance(40);
    expect(session.snapshot.ready).toBe(true);
  });

  it("revient en démo avec un message si la demande caméra courante échoue", async () => {
    const { session, runtime } = setup();
    vi.mocked(runtime.startCamera).mockRejectedValueOnce(
      new Error("Accès refusé"),
    );
    await session.startCamera();
    expect(session.snapshot).toMatchObject({
      source: "demo",
      ready: true,
      busy: false,
      status: { error: true },
    });
    expect(session.snapshot.status.message).toContain("Accès refusé");
  });

  it("refuse de lire un clip d’un autre rig mais conserve les clips importés", () => {
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

  it("pilote la lecture, conserve la lecture au retour au début et la pause au déplacement du curseur", () => {
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

  it("réserve le chargement GLB et remet la sélection à zéro après remplacement du rig", async () => {
    const { session, runtime, clip } = setup();
    const glb = deferred<void>();
    vi.mocked(runtime.loadCharacter).mockReturnValueOnce(glb.promise);
    const bytes = new ArrayBuffer(2);
    const pending = session.importCharacter(bytes, "glb-id", "gobelin.glb");
    session.useDemo();
    await session.startCamera();
    await session.importCharacter(bytes, "second", "autre.glb");
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
      characterName: "gobelin.glb",
      characterKind: "Personnage GLB importé",
    });
  });

  it("conserve le rig et la sélection si le chargement GLB échoue", async () => {
    const { session, runtime, clip } = setup();
    vi.mocked(runtime.loadCharacter).mockRejectedValueOnce(
      new Error("Os manquant"),
    );
    await session.importCharacter(new ArrayBuffer(0), "glb-id", "gobelin.glb");
    expect(session.snapshot).toMatchObject({
      busy: false,
      characterName: "Gobelin mécano",
      selectedClip: clip,
      status: { error: true },
    });
    expect(session.snapshot.status.message).toContain("Os manquant");
  });

  it("suspend la caméra et termine l’enregistrement en arrière-plan", () => {
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

  it("libère le moteur une fois et ignore les commandes et réponses après destruction", async () => {
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
