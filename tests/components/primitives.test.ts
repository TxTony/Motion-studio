// @vitest-environment jsdom
/** Vérifie les contrats publics des primitives Vue, sans état métier ni moteur graphique. */
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
  it("conserve la variante, les attributs accessibles et le contenu sans soumettre un formulaire", async () => {
    const wrapper = mount(StudioButton, {
      props: { variant: "record", selected: true },
      attrs: { "aria-label": "Capturer", title: "Nouvelle capture" },
      slots: { default: "Enregistrer" },
    });
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(["record-button", "selected"]),
    );
    expect(wrapper.attributes("type")).toBe("button");
    expect(wrapper.attributes("aria-label")).toBe("Capturer");
    expect(wrapper.attributes("title")).toBe("Nouvelle capture");
    expect(wrapper.text()).toBe("Enregistrer");
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")?.[0][0]).toBeInstanceOf(MouseEvent);
  });

  it("ne transmet pas d’action lorsque le bouton est désactivé", async () => {
    const wrapper = mount(StudioButton, { props: { disabled: true } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
  });
});

describe("StudioPanel", () => {
  it("compose son titre, son repère, ses actions et son contenu", () => {
    const wrapper = mount(StudioPanel, {
      props: { title: "Animation", tag: "CLIP", icon: "◇" },
      slots: { default: "Contenu métier", actions: "Actions du panneau" },
    });
    expect(wrapper.element.tagName).toBe("SECTION");
    expect(wrapper.classes()).toContain("panel");
    expect(wrapper.get(".panel-head h2").text()).toContain("Animation");
    expect(wrapper.get(".panel-icon").text()).toBe("◇");
    expect(wrapper.get(".tag").text()).toBe("CLIP");
    expect(wrapper.text()).toContain("Contenu métier");
    expect(wrapper.get(".panel-head").text()).toContain("Actions du panneau");
  });
});

describe("Champs de formulaire", () => {
  it("associe le texte à son label et émet une valeur texte sans l’interpréter", async () => {
    const wrapper = mount(StudioTextField, {
      props: {
        id: "clip-name",
        label: "Nom",
        modelValue: "Capture",
        maxlength: 80,
      },
    });
    expect(wrapper.get("label").attributes("for")).toBe("clip-name");
    expect(wrapper.get("input").attributes("maxlength")).toBe("80");
    await wrapper.get("input").setValue("Marche");
    expect(wrapper.emitted("update:modelValue")).toEqual([["Marche"]]);
  });

  it("émet un nombre pour une plage et présente son unité", async () => {
    const wrapper = mount(StudioRangeField, {
      props: {
        id: "smoothing",
        label: "Lissage",
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

  it("garde un curseur superposé accessible sans afficher un second libellé", () => {
    const wrapper = mount(StudioRangeField, {
      props: {
        id: "scrubber",
        label: "Position en secondes",
        modelValue: 0,
        min: 0,
        max: 6,
        overlay: true,
      },
    });
    expect(wrapper.classes()).toContain("range-overlay");
    expect(wrapper.get("input").classes()).toContain("timeline-scrubber");
    expect(wrapper.get("input").attributes("aria-label")).toBe(
      "Position en secondes",
    );
    expect(wrapper.find("label").exists()).toBe(false);
    expect(wrapper.find("output").exists()).toBe(false);
  });

  it("émet un booléen pour une option et applique l’état désactivé", async () => {
    const wrapper = mount(StudioCheckbox, {
      props: { id: "root", label: "Déplacement", modelValue: false },
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
  it("présente des options numériques mais émet la chaîne native du sélecteur", async () => {
    const wrapper = mount(StudioSelect, {
      props: {
        id: "fps",
        label: "Fréquence",
        modelValue: 30,
        options: [
          { label: "30 images/s", value: 30 },
          { label: "15 images/s", value: 15 },
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

  it("préserve le nom accessible en présentation compacte", () => {
    const wrapper = mount(StudioSelect, {
      props: {
        id: "speed",
        label: "Vitesse",
        modelValue: 1,
        options: [{ label: "1×", value: 1 }],
        compact: true,
        disabled: true,
      },
    });
    expect(wrapper.find("label").exists()).toBe(false);
    expect(wrapper.get("select").attributes("aria-label")).toBe("Vitesse");
    expect((wrapper.get("select").element as HTMLSelectElement).disabled).toBe(
      true,
    );
  });
});

describe("StudioFileInput", () => {
  it("ouvre le sélecteur via le bouton commun et relaie le fichier sans règle métier", async () => {
    const wrapper = mount(StudioFileInput, {
      props: { id: "json-import", label: "Importer", accept: ".json" },
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

  it("désactive à la fois la commande et l’input fichier", () => {
    const wrapper = mount(StudioFileInput, {
      props: {
        id: "glb-import",
        label: "Importer",
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
