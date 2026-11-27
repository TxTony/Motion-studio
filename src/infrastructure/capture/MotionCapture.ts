/** Propriétaire exclusif du flux caméra, du modèle MediaPipe et de leur cycle de vie. */
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseSample } from "../../domain/studio";

export class MotionCapture {
  private detector: PoseLandmarker | null = null;
  private stream: MediaStream | null = null;
  private generation = 0;
  private lastVideoTime = -1;
  private lastInference = 0;
  private loading: Promise<void> | null = null;
  /** Lie le flux caméra à la vidéo possédée par le viewer. */
  constructor(private video: HTMLVideoElement) {}
  /** Indique si un flux vidéo a effectivement été obtenu. */
  get active() {
    return this.stream !== null;
  }
  /** Initialise une seule instance du modèle, partagée par les demandes de cette capture. */
  private async load() {
    if (this.detector) return;
    this.loading ??= (async () => {
      const files = await FilesetResolver.forVisionTasks(
        `${import.meta.env.BASE_URL}mediapipe`,
      );
      this.detector = await PoseLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: `${import.meta.env.BASE_URL}models/pose_landmarker_lite.task`,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    })().finally(() => {
      this.loading = null;
    });
    await this.loading;
  }
  /** Demande la vidéo seule et ferme les flux arrivés après une annulation. */
  async start(facingMode: "user" | "environment") {
    this.stop();
    const generation = this.generation;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "La caméra nécessite HTTPS ou localhost et un navigateur compatible.",
      );
    try {
      await this.load();
      if (generation !== this.generation) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (generation !== this.generation) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      this.video.srcObject = stream;
      await this.video.play();
    } catch (error) {
      if (generation === this.generation) this.stop();
      throw error;
    }
  }
  /** Inférence synchrone bornée à 30 Hz, uniquement sur une nouvelle image vidéo. */
  sample(now: number): PoseSample | null | undefined {
    if (
      !this.detector ||
      !this.stream ||
      this.video.readyState < 2 ||
      now - this.lastInference < 1000 / 30 ||
      this.video.currentTime === this.lastVideoTime
    )
      return undefined;
    this.lastVideoTime = this.video.currentTime;
    this.lastInference = now;
    const result = this.detector.detectForVideo(this.video, now);
    if (!result.landmarks[0] || !result.worldLandmarks[0]) return null;
    return {
      timestamp: now,
      image: result.landmarks[0],
      world: result.worldLandmarks[0],
    };
  }
  /** Invalide les demandes précédentes et restitue immédiatement la caméra. */
  stop() {
    this.generation++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
    this.lastVideoTime = -1;
  }
  /** Ferme le flux puis détruit le modèle après une initialisation éventuellement en cours. */
  async dispose() {
    this.stop();
    await this.loading?.catch(() => {});
    this.detector?.close();
    this.detector = null;
  }
}
