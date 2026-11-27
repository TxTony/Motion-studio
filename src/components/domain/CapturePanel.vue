<!-- Compose le viewer de capture et ses commandes ; ne possède aucune règle de caméra. -->
<script setup lang="ts">
import StudioPanel from "../core/StudioPanel.vue";
import StudioButton from "../core/StudioButton.vue";
import StudioSelect from "../selectors/StudioSelect.vue";
import MotionCaptureViewer from "./MotionCaptureViewer.vue";
import type { StudioSnapshot } from "../../application/ports";
const props = defineProps<{ state: StudioSnapshot | null }>();
const emit = defineEmits<{
  videoReady: [video: HTMLVideoElement];
  camera: [];
  demo: [];
  facing: [value: "user" | "environment"];
}>();
const cameraOptions = [
  { value: "user", label: "Caméra avant" },
  { value: "environment", label: "Caméra arrière" },
];
/** Convertit la sélection contrôlée en l’une des deux orientations acceptées. */
function changeFacing(value: string) {
  if (value === "user" || value === "environment") emit("facing", value);
}
</script>
<template>
  <StudioPanel
    title="Capture humaine"
    icon="◉"
    tag="MEDIAPIPE"
    class="capture-panel"
  >
    <MotionCaptureViewer
      :sample="state?.sample ?? null"
      :source="state?.source ?? 'demo'"
      :facing="state?.facing ?? 'user'"
      :caption="state?.captureCaption ?? 'Initialisation du studio…'"
      :fps="state?.captureFps ?? 30"
      @ready="emit('videoReady', $event)"
    />
    <div class="capture-settings">
      <StudioSelect
        id="camera-facing"
        label="Source caméra"
        :model-value="state?.facing ?? 'user'"
        :options="cameraOptions"
        :disabled="!props.state || state?.recording || state?.busy"
        @update:model-value="changeFacing"
      />
      <div class="button-row">
        <StudioButton
          variant="primary"
          :disabled="!state || state.recording || state.busy"
          @click="emit('camera')"
          >◉ Activer la caméra</StudioButton
        ><StudioButton
          variant="subtle"
          :disabled="!state || state.recording"
          title="Revenir à la source synthétique"
          @click="emit('demo')"
          >Démo</StudioButton
        >
      </div>
      <p class="hint">
        Cadrez le corps entier, à 2–3 mètres. Gardez les articulations visibles.
      </p>
    </div>
  </StudioPanel>
</template>
