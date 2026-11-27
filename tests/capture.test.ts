/** Tests camera access and cancellation with mock streams. */
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
const detector = vi.hoisted(() => ({
  detectForVideo: vi.fn(),
  close: vi.fn(),
}));
vi.mock("@mediapipe/tasks-vision", () => ({
  FilesetResolver: { forVisionTasks: vi.fn(async () => ({})) },
  PoseLandmarker: { createFromOptions: vi.fn(async () => detector) },
}));
import { MotionCapture } from "../src/infrastructure/capture/MotionCapture";

const stop = vi.fn(),
  getUserMedia = vi.fn();
function video() {
  return {
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    srcObject: null,
    readyState: 2,
    currentTime: 1,
  } as unknown as HTMLVideoElement;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("window", { isSecureContext: true });
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
});
afterEach(() => vi.unstubAllGlobals());
describe("MotionCapture", () => {
  it("requests video only and releases the stream", async () => {
    const v = video(),
      c = new MotionCapture(v);
    await c.start("environment");
    expect(c.active).toBe(true);
    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: false,
        video: expect.objectContaining({
          facingMode: { ideal: "environment" },
        }),
      }),
    );
    c.stop();
    expect(stop).toHaveBeenCalledOnce();
    expect(v.srcObject).toBeNull();
    await c.dispose();
    expect(detector.close).toHaveBeenCalledOnce();
  });
  it("stops a stream that arrives after cancellation", async () => {
    let resolve!: (stream: unknown) => void;
    getUserMedia.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const c = new MotionCapture(video()),
      pending = c.start("user");
    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    c.stop();
    resolve({ getTracks: () => [{ stop }] });
    await pending;
    expect(c.active).toBe(false);
    expect(stop).toHaveBeenCalledOnce();
  });
  it("rejects insecure contexts and propagates permission errors", async () => {
    vi.stubGlobal("window", { isSecureContext: false });
    const c = new MotionCapture(video());
    await expect(c.start("user")).rejects.toThrow("HTTPS");
    vi.stubGlobal("window", { isSecureContext: true });
    getUserMedia.mockRejectedValue(new Error("Permission denied"));
    await expect(c.start("user")).rejects.toThrow("Permission denied");
    expect(c.active).toBe(false);
  });
  it("runs inference only on new frames, up to 30 Hz", async () => {
    detector.detectForVideo.mockReturnValue({
      landmarks: [],
      worldLandmarks: [],
    });
    const v = video(),
      c = new MotionCapture(v);
    await c.start("user");
    expect(c.sample(100)).toBeNull();
    expect(c.sample(110)).toBeUndefined();
    expect(c.sample(150)).toBeUndefined();
    v.currentTime = 2;
    expect(c.sample(150)).toBeNull();
    expect(detector.detectForVideo).toHaveBeenCalledTimes(2);
    await c.dispose();
  });
});
