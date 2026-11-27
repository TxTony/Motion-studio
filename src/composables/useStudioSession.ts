/** Connects a tested session to Vue and browser lifecycle without deeply reactive engine objects. */
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { StudioSession } from "../application/StudioSession";
import type { StudioSnapshot } from "../application/ports";
import type { StudioSettings } from "../application/studio-state";
import type { AnimationClip } from "../domain/studio";
import { createBrowserRuntime } from "../infrastructure/create-browser-runtime";
import type { CharacterRenderer } from "../infrastructure/three/CharacterRenderer";
import { interpolateRigPose } from "../infrastructure/three/interpolateRigPose";
import {
  downloadAnimation,
  readAnimationFile,
  readCharacterFile,
} from "../infrastructure/files/studio-files";

/** Creates one studio per page mount and injects its adapters once the viewers are ready. */
export function useStudioSession() {
  const state = shallowRef<StudioSnapshot | null>(null);
  const initializationError = shallowRef("");
  let session: StudioSession | null = null,
    video: HTMLVideoElement | null = null,
    renderer: CharacterRenderer | null = null;
  let frameId = 0,
    disposed = false;
  /** Publishes the current snapshot without turning clips, poses or the engine into deep proxies. */
  function publish() {
    if (session) state.value = session.snapshot;
  }
  /** Executes a synchronous intention and then publishes its snapshot. */
  function run(command: (current: StudioSession) => void) {
    if (!session) return;
    command(session);
    publish();
  }
  /** Publishes the busy state before awaiting an asynchronous command. */
  async function runAsync(command: (current: StudioSession) => Promise<void>) {
    if (!session) return;
    const pending = command(session);
    publish();
    await pending;
    if (!disposed) publish();
  }
  /** Advances the application using the browser clock and schedules one next frame. */
  function frame(now: number) {
    if (disposed || !session) return;
    session.tick(now);
    publish();
    frameId = requestAnimationFrame(frame);
  }
  /** Assembles a single session once both video and scene have mounted. */
  function connect() {
    if (session || !video || !renderer || disposed) return;
    session = new StudioSession({
      runtime: createBrowserRuntime(video, renderer),
      now: () => performance.now(),
      interpolate: interpolateRigPose,
    });
    publish();
    frameId = requestAnimationFrame(frame);
  }
  /** Receives the video element owned by the capture viewer. */
  function bindVideo(element: HTMLVideoElement) {
    video = element;
    connect();
  }
  /** Receives the renderer owned by the 3D viewer without taking over its teardown. */
  function bindRenderer(value: CharacterRenderer) {
    renderer = value;
    connect();
  }
  /** Displays a WebGL initialization failure even before a session can be created. */
  function failInitialization(message: string) {
    initializationError.value = message;
  }
  /** Closes the source when the page moves to the background. */
  function handleVisibility() {
    if (document.hidden) run((current) => current.suspend());
  }
  /** Stops the loop and listeners before child viewers are destroyed. */
  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", cleanup);
    void session?.dispose();
  }
  /** Converts a file error to an explicit session status. */
  function fileError(prefix: string, error: unknown) {
    run((current) =>
      current.reportError(
        `${prefix}: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
  /** Validates and adds a local JSON clip without exposing File to the domain. */
  async function importJson(file: File) {
    try {
      const clip = await readAnimationFile(file);
      if (!disposed) run((current) => current.importClip(clip));
    } catch (error) {
      fileError("Import failed", error);
    }
  }
  /** Identifies a GLB before passing only its bytes and name to the session. */
  async function importGlb(file: File) {
    try {
      const character = await readCharacterFile(file);
      if (!disposed)
        await runAsync((current) =>
          current.importCharacter(
            character.bytes,
            character.id,
            character.name,
          ),
        );
    } catch (error) {
      fileError("GLB import failed", error);
    }
  }
  /** Saves the selected clip through the local browser adapter. */
  function exportJson() {
    const clip = state.value?.selectedClip;
    if (!clip || state.value?.recording) return;
    try {
      downloadAnimation(clip);
      run((current) =>
        current.reportInfo("JSON clip exported. Videos are never recorded."),
      );
    } catch (error) {
      fileError("Export failed", error);
    }
  }
  onMounted(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", cleanup);
  });
  onBeforeUnmount(cleanup);
  const commands = {
    configure: (settings: Partial<StudioSettings>) =>
      run((current) => current.configure(settings)),
    startCamera: () => runAsync((current) => current.startCamera()),
    useDemo: () => run((current) => current.useDemo()),
    startRecording: () => run((current) => current.startRecording()),
    stopRecording: () => run((current) => current.stopRecording()),
    live: () => run((current) => current.live()),
    selectClip: (clip: AnimationClip) =>
      run((current) => current.selectClip(clip)),
    togglePlay: () => run((current) => current.togglePlay()),
    rewind: () => run((current) => current.rewind()),
    seek: (time: number) => run((current) => current.seek(time)),
    toggleLoop: () => run((current) => current.toggleLoop()),
    setSpeed: (speed: number) => run((current) => current.setSpeed(speed)),
    calibrate: () => run((current) => current.calibrate()),
    resetView: () => run((current) => current.resetView()),
    importJson,
    importGlb,
    exportJson,
  };
  return {
    state,
    commands,
    bindVideo,
    bindRenderer,
    initializationError,
    failInitialization,
  };
}
