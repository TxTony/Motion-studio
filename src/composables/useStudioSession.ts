/** Raccorde une session testée à Vue et au cycle de vie du navigateur, sans moteur profondément réactif. */
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

/** Crée un studio par montage de page et injecte ses seuls adaptateurs lorsque les viewers sont prêts. */
export function useStudioSession() {
  const state = shallowRef<StudioSnapshot | null>(null);
  const initializationError = shallowRef("");
  let session: StudioSession | null = null,
    video: HTMLVideoElement | null = null,
    renderer: CharacterRenderer | null = null;
  let frameId = 0,
    disposed = false;
  /** Publie la projection courante sans convertir clips, poses et moteur en proxies profonds. */
  function publish() {
    if (session) state.value = session.snapshot;
  }
  /** Exécute une intention synchrone puis rend sa projection visible. */
  function run(command: (current: StudioSession) => void) {
    if (!session) return;
    command(session);
    publish();
  }
  /** Publie l’état occupé avant d’attendre une commande asynchrone. */
  async function runAsync(command: (current: StudioSession) => Promise<void>) {
    if (!session) return;
    const pending = command(session);
    publish();
    await pending;
    if (!disposed) publish();
  }
  /** Avance l’application selon l’horloge navigateur et programme une seule image suivante. */
  function frame(now: number) {
    if (disposed || !session) return;
    session.tick(now);
    publish();
    frameId = requestAnimationFrame(frame);
  }
  /** Assemble une seule session dès que vidéo et scène ont été montées. */
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
  /** Reçoit l’élément vidéo possédé par le viewer de capture. */
  function bindVideo(element: HTMLVideoElement) {
    video = element;
    connect();
  }
  /** Reçoit le renderer possédé par le viewer 3D, sans lui transférer sa destruction. */
  function bindRenderer(value: CharacterRenderer) {
    renderer = value;
    connect();
  }
  /** Affiche une indisponibilité de WebGL même si la session n’a pas encore pu être créée. */
  function failInitialization(message: string) {
    initializationError.value = message;
  }
  /** Ferme la source lorsque la page passe en arrière-plan. */
  function handleVisibility() {
    if (document.hidden) run((current) => current.suspend());
  }
  /** Arrête boucle et écouteurs avant la destruction des viewers enfants. */
  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", cleanup);
    void session?.dispose();
  }
  /** Convertit une erreur de fichier en statut de session explicite. */
  function fileError(prefix: string, error: unknown) {
    run((current) =>
      current.reportError(
        `${prefix} : ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
  /** Valide et ajoute un JSON local sans exposer File au domaine. */
  async function importJson(file: File) {
    try {
      const clip = await readAnimationFile(file);
      if (!disposed) run((current) => current.importClip(clip));
    } catch (error) {
      fileError("Import refusé", error);
    }
  }
  /** Identifie un GLB avant de transmettre uniquement ses octets et son nom à la session. */
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
      fileError("Import GLB refusé", error);
    }
  }
  /** Sauvegarde le clip sélectionné via l’adaptateur local du navigateur. */
  function exportJson() {
    const clip = state.value?.selectedClip;
    if (!clip || state.value?.recording) return;
    try {
      downloadAnimation(clip);
      run((current) =>
        current.reportInfo(
          "Clip JSON exporté. Les vidéos ne sont jamais enregistrées.",
        ),
      );
    } catch (error) {
      fileError("Export refusé", error);
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
