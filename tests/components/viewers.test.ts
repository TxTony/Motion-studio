// @vitest-environment jsdom
/** Characterizes Vue viewer ownership: a single mount, readable errors and cleanup on unmount. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
const mocks = vi.hoisted(() => ({
  dispose: vi.fn(),
  construct: vi.fn(),
  disconnect: vi.fn(),
  observe: vi.fn(),
}));
vi.mock("../../src/infrastructure/three/CharacterRenderer", () => ({
  CharacterRenderer: class {
    constructor() {
      mocks.construct();
    }
    dispose() {
      mocks.dispose();
    }
  },
}));
import Scene3DViewer from "../../src/components/domain/Scene3DViewer.vue";
import MotionCaptureViewer from "../../src/components/domain/MotionCaptureViewer.vue";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = mocks.observe;
      disconnect = mocks.disconnect;
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("viewers", () => {
  it("mounts a renderer and disposes it exactly once", () => {
    const wrapper = mount(Scene3DViewer, {
      props: { name: "Default character", kind: "Procedural rig" },
    });
    expect(wrapper.emitted("ready")).toHaveLength(1);
    expect(mocks.construct).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
  it("reports unavailable WebGL without claiming that the scene is ready", () => {
    mocks.construct.mockImplementationOnce(() => {
      throw new Error("WebGL");
    });
    const wrapper = mount(Scene3DViewer, {
      props: { name: "Default character", kind: "Procedural rig" },
    });
    expect(wrapper.emitted("ready")).toBeUndefined();
    expect(wrapper.emitted("error")?.[0]?.[0]).toContain(
      "WebGL is unavailable",
    );
    wrapper.unmount();
  });
  it("exposes the video and disconnects the overlay observer", () => {
    const wrapper = mount(MotionCaptureViewer, {
      props: {
        sample: null,
        source: "camera",
        facing: "user",
        caption: "Searching",
        fps: 30,
      },
    });
    expect(wrapper.emitted("ready")?.[0]?.[0]).toBeInstanceOf(HTMLVideoElement);
    expect(wrapper.classes()).toContain("mirrored");
    expect(mocks.observe).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });
  it("uses native dimensions after metadata and resets them when switching to demo", async () => {
    const wrapper = mount(MotionCaptureViewer, {
      props: {
        sample: null,
        source: "camera",
        facing: "user",
        caption: "Searching",
        fps: 0,
      },
    });
    const video = wrapper.get("video").element,
      canvas = wrapper.get("canvas").element;
    Object.defineProperties(video, {
      videoWidth: { value: 720 },
      videoHeight: { value: 960 },
    });
    await wrapper.get("video").trigger("loadedmetadata");
    expect([canvas.width, canvas.height]).toEqual([720, 960]);
    await wrapper.setProps({ source: "demo" });
    expect([canvas.width, canvas.height]).toEqual([640, 480]);
    expect(wrapper.classes()).not.toContain("mirrored");
    wrapper.unmount();
  });
});
