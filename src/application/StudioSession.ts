/** Orchestre capture, lecture et bibliothèque. Le moteur et l’horloge arrivent par les ports injectés. */
import {
  AnimationPlayer,
  type PoseInterpolator,
} from "../domain/animation/AnimationPlayer";
import { AnimationRecorder } from "../domain/animation/AnimationRecorder";
import type { AnimationClip, PoseSample } from "../domain/studio";
import type { SessionRuntime, StudioSnapshot } from "./ports";
import {
  createStudioState,
  demoCaption,
  type StudioSettings,
  type StudioState,
} from "./studio-state";

const bodyLossMs = 750;
const recordingLimitMs = 300_000;
const demoMessage =
  "Mode démo actif : mouvements synthétiques, enregistrement et export disponibles.";

export interface SessionOptions {
  runtime: SessionRuntime;
  /** Horloge monotone en millisecondes, dans le même repère que tick. */
  now: () => number;
  interpolate: PoseInterpolator;
}

/** Tire le message utile d’une erreur reçue d’un port. */
function detail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class StudioSession {
  private readonly runtime: SessionRuntime;
  private readonly now: () => number;
  private readonly recorder = new AnimationRecorder();
  private readonly player: AnimationPlayer;
  private readonly state: StudioState;
  private operation: "camera" | "character" | null = null;
  private cameraGeneration = 0;
  private disposal: Promise<void> | null = null;
  private previousTick: number;
  private lastSample = 0;
  private lastPoseAt = 0;
  private recordStart = 0;

  /** Prépare la démo et sélectionne son clip sans quitter le temps réel. */
  constructor({ runtime, now, interpolate }: SessionOptions) {
    this.runtime = runtime;
    this.now = now;
    this.player = new AnimationPlayer(interpolate);
    const demoClip = runtime.createDemoClip();
    this.state = createStudioState(demoClip);
    this.player.load(demoClip);
    this.previousTick = now();
  }

  /** Expose un instantané peu profond. La bibliothèque est remplacée à chaque ajout. */
  get snapshot(): StudioSnapshot {
    return {
      ...this.state,
      busy: this.operation !== null,
      recording: this.recorder.recording,
      playing: this.player.playing,
      loop: this.player.loop,
      speed: this.player.speed,
      selectedClip: this.player.clip,
      time: this.player.time,
    };
  }

  /** Indique si une capture ou un chargement réserve les commandes de changement. */
  private get locked(): boolean {
    return (
      this.disposal !== null ||
      this.operation !== null ||
      this.recorder.recording
    );
  }

  /** Ajuste les réglages. Le lissage exprimé en secondes reste actif pendant la capture. */
  configure(patch: Partial<StudioSettings>): void {
    if (this.disposal) return;
    const smoothing = patch.smoothing ?? this.state.smoothing;
    const captureRoot = this.locked
      ? this.state.captureRoot
      : (patch.captureRoot ?? this.state.captureRoot);
    const rootChanged = captureRoot !== this.state.captureRoot;
    if (rootChanged || smoothing !== this.state.smoothing) {
      this.runtime.configureRetarget({ smoothing, captureRoot });
      this.state.smoothing = smoothing;
      this.state.captureRoot = captureRoot;
      if (rootChanged) this.runtime.resetRetarget();
    }
    if (!this.locked) {
      this.state.clipName = patch.clipName ?? this.state.clipName;
      this.state.fps = patch.fps ?? this.state.fps;
      this.state.facing = patch.facing ?? this.state.facing;
    }
  }

  /** Affiche un échec signalé par une frontière externe, par exemple le lecteur de fichiers. */
  reportError(message: string): void {
    if (!this.disposal) this.state.status = { message, error: true };
  }

  /** Affiche une information de session, par exemple la confirmation d’un export. */
  reportInfo(message: string): void {
    if (!this.disposal) this.state.status = { message, error: false };
  }

  /** Replace l’origine du déplacement sur la prochaine pose valide. */
  calibrate(): void {
    if (this.disposal) return;
    this.runtime.resetRetarget();
    this.reportInfo(
      "Origine du déplacement réinitialisée sur la prochaine pose.",
    );
  }

  /** Recentre la vue sans changer la pose ni le mode de session. */
  resetView(): void {
    if (!this.disposal) this.runtime.resetView();
  }

  /** Revient à la source temps réel pour préparer une nouvelle capture. */
  live(): void {
    if (this.locked) return;
    this.enterLive();
    this.reportInfo(
      "Source temps réel active. Nommez le clip puis lancez l’enregistrement.",
    );
  }

  /** Arrête la caméra, annule une demande en attente et revient en démo. */
  useDemo(): void {
    if (
      this.disposal ||
      this.recorder.recording ||
      this.operation === "character"
    )
      return;
    this.enterDemo();
    this.reportInfo(demoMessage);
  }

  /** Demande la caméra et ignore toute réponse invalidée par une autre commande de source. */
  async startCamera(): Promise<void> {
    if (this.locked) return;
    const generation = ++this.cameraGeneration;
    this.operation = "camera";
    this.enterLive();
    this.reportInfo(
      "Chargement de MediaPipe puis demande d’accès à la caméra…",
    );

    try {
      const active = await this.runtime.startCamera(this.state.facing);
      if (generation !== this.cameraGeneration) return;
      if (!active) {
        this.useDemo();
        return;
      }
      this.state.source = "camera";
      this.state.ready = false;
      this.lastPoseAt = this.now();
      this.state.sample = null;
      this.state.captureCaption = "Recherche du corps entier…";
      this.reportInfo(
        "Caméra active. Cadrez le corps entier ; les poses sont traitées localement.",
      );
    } catch (error) {
      if (generation !== this.cameraGeneration) return;
      this.enterDemo();
      this.reportError(
        `Caméra indisponible : ${detail(error)}. Le mode démo reste disponible.`,
      );
    } finally {
      if (generation === this.cameraGeneration) this.operation = null;
    }
  }

  /** Lance la capture du rig courant si la source est disponible. */
  startRecording(): void {
    if (this.locked || !this.state.ready) return;
    this.enterLive();
    this.recordStart = this.now();
    this.recorder.start(
      this.state.clipName,
      this.runtime.rigId,
      this.state.fps,
      this.recordStart,
    );
    this.state.recordingTime = 0;
    const source =
      this.state.source === "demo" ? "de la source synthétique" : "caméra";
    this.reportInfo(`Enregistrement ${source} en cours. Limite : 5 minutes.`);
  }

  /** Arrête la capture et sélectionne son clip lorsqu’il contient assez de poses. */
  stopRecording(): void {
    if (this.disposal || !this.recorder.recording) return;
    const clip = this.recorder.stop();
    if (!clip) {
      this.reportError(
        "Capture trop courte ou aucune pose détectée. Aucun clip créé.",
      );
      return;
    }
    this.state.clips = [...this.state.clips, clip];
    this.selectClip(clip);
    this.state.clipName = `Capture_${String(this.state.clips.length).padStart(2, "0")}`;
    this.reportInfo(
      `« ${clip.name} » enregistré : ${clip.frames.length} poses. Exportez le JSON pour le conserver.`,
    );
  }

  /** Charge et applique la première pose d’un clip compatible avec le rig actif. */
  selectClip(clip: AnimationClip): void {
    if (this.locked) return;
    if (clip.rig !== this.runtime.rigId) {
      this.reportError(
        "Ce clip appartient à un autre rig. Rechargez le personnage utilisé pour cette capture.",
      );
      return;
    }
    this.player.load(clip);
    this.state.mode = "playback";
    this.runtime.resetRetarget();
    const pose = this.player.sample();
    if (pose) this.runtime.apply(pose);
    this.reportInfo(
      `Clip « ${clip.name} » chargé. Lecture, boucle et timeline disponibles.`,
    );
  }

  /** Démarre ou suspend la lecture. Repart du début après la fin du clip. */
  togglePlay(): void {
    const clip = this.player.clip;
    if (this.locked || !clip) return;
    if (this.state.mode === "live") {
      this.state.mode = "playback";
      this.runtime.resetRetarget();
    }
    if (this.player.time >= clip.duration) this.player.seek(0);
    this.player.playing = !this.player.playing;
  }

  /** Replace la tête au début du clip en conservant l’état lecture ou pause. */
  rewind(): void {
    if (this.locked || !this.player.clip) return;
    this.state.mode = "playback";
    this.player.seek(0);
  }

  /** Positionne la tête en secondes et met la lecture en pause. */
  seek(seconds: number): void {
    if (this.locked || !this.player.clip) return;
    this.player.playing = false;
    this.state.mode = "playback";
    this.player.seek(seconds);
  }

  /** Active ou désactive la répétition du clip sélectionné. */
  toggleLoop(): void {
    if (!this.locked && this.player.clip) this.player.loop = !this.player.loop;
  }

  /** Règle le multiplicateur de vitesse utilisé à la prochaine lecture. */
  setSpeed(speed: number): void {
    if (!this.disposal) this.player.speed = speed;
  }

  /** Ajoute un clip déjà validé à la bibliothèque puis tente de le charger. */
  importClip(clip: AnimationClip): void {
    if (this.locked) return;
    this.state.clips = [...this.state.clips, clip];
    this.selectClip(clip);
  }

  /** Attend le remplacement du rig et réinitialise la sélection une fois le chargement réussi. */
  async importCharacter(
    bytes: ArrayBuffer,
    id: string,
    name: string,
  ): Promise<void> {
    if (this.locked) return;
    this.operation = "character";
    this.enterLive();
    try {
      await this.runtime.loadCharacter(bytes, id);
      if (this.disposal) return;
      this.player.clip = null;
      this.player.seek(0);
      this.state.characterName = name;
      this.state.characterKind = "Personnage GLB importé";
      this.reportInfo(
        "Personnage GLB chargé. Les captures suivantes utiliseront ce rig.",
      );
    } catch (error) {
      this.reportError(`Import GLB refusé : ${detail(error)}`);
    } finally {
      if (!this.disposal) {
        this.operation = null;
        this.runtime.resetRetarget();
      }
    }
  }

  /** Échantillonne la source, avance la lecture si active, puis rend la scène. */
  tick(nowMs: number): void {
    if (this.disposal) return;
    const deltaSeconds = Math.min((nowMs - this.previousTick) / 1000, 0.1);
    this.previousTick = nowMs;
    try {
      this.readCapture(nowMs);
      if (this.recorder.recording) {
        this.state.recordingTime = (nowMs - this.recordStart) / 1000;
        if (nowMs - this.recordStart > recordingLimitMs) this.stopRecording();
      }
      if (this.state.mode === "playback") {
        const pose = this.player.update(deltaSeconds);
        if (pose) this.runtime.apply(pose);
      }
      this.runtime.render();
    } catch (error) {
      this.stopRecording();
      this.enterDemo();
      this.reportError(
        `Capture interrompue : ${detail(error)}. Retour au mode démo.`,
      );
    }
  }

  /** Termine une capture en cours et arrête la caméra lors du passage en arrière-plan. */
  suspend(): void {
    if (this.disposal) return;
    this.stopRecording();
    this.enterDemo();
    this.reportInfo(
      "Caméra arrêtée au passage en arrière-plan. Réactivez-la pour reprendre.",
    );
  }

  /** Invalide les réponses en attente et libère les adaptateurs une seule fois. */
  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    this.cameraGeneration++;
    this.operation = null;
    this.recorder.stop();
    this.player.playing = false;
    this.disposal = Promise.resolve().then(() => this.runtime.dispose());
    return this.disposal;
  }

  /** Quitte la lecture et réinitialise l’échantillonnage du retargeting. */
  private enterLive(): void {
    this.player.playing = false;
    this.state.mode = "live";
    this.runtime.resetRetarget();
    this.lastSample = 0;
  }

  /** Rétablit la démo sans déverrouiller un éventuel chargement GLB encore actif. */
  private enterDemo(): void {
    this.cameraGeneration++;
    if (this.operation === "camera") this.operation = null;
    this.runtime.stopCamera();
    this.state.source = "demo";
    this.state.ready = true;
    this.state.sample = null;
    this.state.captureCaption = demoCaption;
    this.enterLive();
  }

  /** Conserve l’image précédente entre deux inférences et retire le squelette dès que le corps manque. */
  private readCapture(nowMs: number): void {
    const sample = this.runtime.sample(nowMs, this.state.source);
    if (sample !== undefined) this.state.sample = sample;
    if (sample) this.updateLivePose(sample, nowMs);
    if (
      this.state.source === "camera" &&
      nowMs - this.lastPoseAt > bodyLossMs
    ) {
      this.state.ready = false;
      this.state.captureCaption = "Corps perdu · pose maintenue";
      this.state.sample = null;
    }
  }

  /** Met à jour les mesures caméra et transmet les nouvelles poses au rendu et à l’enregistrement. */
  private updateLivePose(sample: PoseSample, nowMs: number): void {
    const deltaSeconds = this.lastSample
      ? (nowMs - this.lastSample) / 1000
      : 1 / 30;
    this.lastSample = nowMs;
    this.lastPoseAt = nowMs;
    this.state.ready = true;
    if (this.state.source === "camera") {
      const visible = sample.image.filter(
        (point) => (point.visibility ?? 0) > 0.5,
      ).length;
      this.state.captureCaption = `${visible}/33 articulations visibles`;
      this.state.captureFps = Math.min(30, Math.round(1 / deltaSeconds));
    }
    if (this.state.mode === "playback") return;
    const pose = this.runtime.solve(sample, deltaSeconds);
    if (!pose) return;
    this.runtime.apply(pose);
    if (this.recorder.recording && !this.recorder.add(pose, nowMs))
      this.stopRecording();
  }
}
