// @vitest-environment jsdom
/** Caractérise la propriété des viewers Vue : montage unique, erreur lisible et nettoyage au démontage. */
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
  it("monte un renderer et le détruit une seule fois", () => {
    const wrapper = mount(Scene3DViewer, {
      props: { name: "Gobelin", kind: "Procédural" },
    });
    expect(wrapper.emitted("ready")).toHaveLength(1);
    expect(mocks.construct).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
  it("signale WebGL indisponible sans prétendre une scène prête", () => {
    mocks.construct.mockImplementationOnce(() => {
      throw new Error("WebGL");
    });
    const wrapper = mount(Scene3DViewer, {
      props: { name: "Gobelin", kind: "Procédural" },
    });
    expect(wrapper.emitted("ready")).toBeUndefined();
    expect(wrapper.emitted("error")?.[0]?.[0]).toContain("WebGL indisponible");
    wrapper.unmount();
  });
  it("expose la vidéo et détache l’observer de l’overlay", () => {
    const wrapper = mount(MotionCaptureViewer, {
      props: {
        sample: null,
        source: "camera",
        facing: "user",
        caption: "Recherche",
        fps: 30,
      },
    });
    expect(wrapper.emitted("ready")?.[0]?.[0]).toBeInstanceOf(HTMLVideoElement);
    expect(wrapper.classes()).toContain("mirrored");
    expect(mocks.observe).toHaveBeenCalledOnce();
    wrapper.unmount();
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });
});
