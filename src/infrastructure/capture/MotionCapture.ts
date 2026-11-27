/** Owns the camera stream, MediaPipe model, and their lifecycles. */
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseSample } from "../../domain/studio";

export class MotionCapture {
  private detector: PoseLandmarker | null = null;
  private stream: MediaStream | null = null;
  private generation = 0;
  private lastVideoTime = -1;
  private lastInference = 0;
  private loading: Promise<void> | null = null;
  /** Binds the camera stream to the viewer-owned video element. */
  constructor(private video: HTMLVideoElement) {}
  /** Indicates whether a video stream is active. */
  get active() {
    return this.stream !== null;
  }
  /** Initializes one model instance shared by this capture's requests. */
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
  /** Requests video only and closes streams that arrive after cancellation. */
  async start(facingMode: "user" | "environment") {
    this.stop();
    const generation = this.generation;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "Camera access requires HTTPS or localhost and a compatible browser.",
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
  /** Runs synchronous inference on new video frames only, up to 30 Hz. */
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
  /** Invalidates pending requests and releases the camera immediately. */
  stop() {
    this.generation++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
    this.lastVideoTime = -1;
  }
  /** Closes the stream and disposes the model after any pending initialization finishes. */
  async dispose() {
    this.stop();
    await this.loading?.catch(() => {});
    this.detector?.close();
    this.detector = null;
  }
}
