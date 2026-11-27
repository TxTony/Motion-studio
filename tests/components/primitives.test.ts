// @vitest-environment jsdom
/** Verifies the public contracts of Vue primitives without business state or a graphics engine. */
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import StudioButton from "../../src/components/core/StudioButton.vue";
import StudioPanel from "../../src/components/core/StudioPanel.vue";
import StudioTextField from "../../src/components/forms/StudioTextField.vue";
import StudioRangeField from "../../src/components/forms/StudioRangeField.vue";
import StudioCheckbox from "../../src/components/forms/StudioCheckbox.vue";
import StudioFileInput from "../../src/components/forms/StudioFileInput.vue";
import StudioSelect from "../../src/components/selectors/StudioSelect.vue";

describe("StudioButton", () => {
  it("preserves the variant, accessible attributes and content without submitting a form", async () => {
    const wrapper = mount(StudioButton, {
      props: { variant: "record", selected: true },
      attrs: { "aria-label": "Capture", title: "New capture" },
      slots: { default: "Record" },
    });
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(["record-button", "selected"]),
    );
    expect(wrapper.attributes("type")).toBe("button");
    expect(wrapper.attributes("aria-label")).toBe("Capture");
    expect(wrapper.attributes("title")).toBe("New capture");
    expect(wrapper.text()).toBe("Record");
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")?.[0][0]).toBeInstanceOf(MouseEvent);
  });

  it("does not emit an action when the button is disabled", async () => {
    const wrapper = mount(StudioButton, { props: { disabled: true } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
  });
});

describe("StudioPanel", () => {
  it("composes its title, tag, actions and content", () => {
    const wrapper = mount(StudioPanel, {
      props: { title: "Animation", tag: "CLIP", icon: "◇" },
      slots: { default: "Business content", actions: "Panel actions" },
    });
    expect(wrapper.element.tagName).toBe("SECTION");
    expect(wrapper.classes()).toContain("panel");
    expect(wrapper.get(".panel-head h2").text()).toContain("Animation");
    expect(wrapper.get(".panel-icon").text()).toBe("◇");
    expect(wrapper.get(".tag").text()).toBe("CLIP");
    expect(wrapper.text()).toContain("Business content");
    expect(wrapper.get(".panel-head").text()).toContain("Panel actions");
  });
});

describe("Form fields", () => {
  it("associates text with its label and emits a string without interpreting it", async () => {
    const wrapper = mount(StudioTextField, {
      props: {
        id: "clip-name",
        label: "Name",
        modelValue: "Capture",
        maxlength: 80,
      },
    });
    expect(wrapper.get("label").attributes("for")).toBe("clip-name");
    expect(wrapper.get("input").attributes("maxlength")).toBe("80");
    await wrapper.get("input").setValue("Walk");
    expect(wrapper.emitted("update:modelValue")).toEqual([["Walk"]]);
  });

  it("emits a number for a slider and presents its unit", async () => {
    const wrapper = mount(StudioRangeField, {
      props: {
        id: "smoothing",
        label: "Smoothing",
        modelValue: 120,
        min: 0,
        max: 400,
        step: 10,
        unit: "ms",
      },
    });
    expect(wrapper.get("output").text()).toBe("120 ms");
    await wrapper.get("input").setValue("240");
    expect(wrapper.emitted("update:modelValue")).toEqual([[240]]);
  });

  it("keeps an overlay slider accessible without displaying a second label", () => {
    const wrapper = mount(StudioRangeField, {
      props: {
        id: "scrubber",
        label: "Position in seconds",
        modelValue: 0,
        min: 0,
        max: 6,
        overlay: true,
      },
    });
    expect(wrapper.classes()).toContain("range-overlay");
    expect(wrapper.get("input").classes()).toContain("timeline-scrubber");
    expect(wrapper.get("input").attributes("aria-label")).toBe(
      "Position in seconds",
    );
    expect(wrapper.find("label").exists()).toBe(false);
    expect(wrapper.find("output").exists()).toBe(false);
  });

  it("emits a boolean for an option and applies the disabled state", async () => {
    const wrapper = mount(StudioCheckbox, {
      props: { id: "root", label: "Movement", modelValue: false },
    });
    await wrapper.get("input").setValue(true);
    expect(wrapper.emitted("update:modelValue")).toEqual([[true]]);
    await wrapper.setProps({ disabled: true });
    expect((wrapper.get("input").element as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});

describe("StudioSelect", () => {
  it("presents numeric options while emitting the native selector string", async () => {
    const wrapper = mount(StudioSelect, {
      props: {
        id: "fps",
        label: "Frequency",
        modelValue: 30,
        options: [
          { label: "30 frames/s", value: 30 },
          { label: "15 frames/s", value: 15 },
        ],
      },
    });
    expect(wrapper.get("label").attributes("for")).toBe("fps");
    expect((wrapper.get("select").element as HTMLSelectElement).value).toBe(
      "30",
    );
    await wrapper.get("select").setValue("15");
    expect(wrapper.emitted("update:modelValue")).toEqual([["15"]]);
  });

  it("preserves the accessible name in compact presentation", () => {
    const wrapper = mount(StudioSelect, {
      props: {
        id: "speed",
        label: "Speed",
        modelValue: 1,
        options: [{ label: "1×", value: 1 }],
        compact: true,
        disabled: true,
      },
    });
    expect(wrapper.find("label").exists()).toBe(false);
    expect(wrapper.get("select").attributes("aria-label")).toBe("Speed");
    expect((wrapper.get("select").element as HTMLSelectElement).disabled).toBe(
      true,
    );
  });
});

describe("StudioFileInput", () => {
  it("opens the picker through the shared button and forwards the file without business rules", async () => {
    const wrapper = mount(StudioFileInput, {
      props: { id: "json-import", label: "Import", accept: ".json" },
    });
    const input = wrapper.get("input").element as HTMLInputElement;
    const open = vi.spyOn(input, "click").mockImplementation(() => undefined);
    await wrapper.getComponent(StudioButton).trigger("click");
    expect(open).toHaveBeenCalledOnce();
    expect(input.accept).toBe(".json");
    const file = new File(["{}"], "capture.json", { type: "application/json" });
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file],
    });
    Object.defineProperty(input, "value", {
      configurable: true,
      writable: true,
      value: "capture.json",
    });
    await wrapper.get("input").trigger("change");
    expect(wrapper.emitted("selected")).toEqual([[file]]);
    expect(input.value).toBe("");
    await wrapper.get("input").trigger("change");
    expect(wrapper.emitted("selected")).toEqual([[file], [file]]);
    open.mockRestore();
  });

  it("disables both the action and the file input", () => {
    const wrapper = mount(StudioFileInput, {
      props: {
        id: "glb-import",
        label: "Import",
        accept: ".glb",
        disabled: true,
      },
    });
    expect(wrapper.getComponent(StudioButton).props("disabled")).toBe(true);
    expect((wrapper.get("input").element as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
