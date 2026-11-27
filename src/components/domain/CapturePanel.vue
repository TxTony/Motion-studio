<!-- Composes the capture viewer and its commands without owning camera rules. -->
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
  { value: "user", label: "Front camera" },
  { value: "environment", label: "Rear camera" },
];
/** Converts the controlled selection to one of the two supported camera orientations. */
function changeFacing(value: string) {
  if (value === "user" || value === "environment") emit("facing", value);
}
</script>
<template>
  <StudioPanel
    title="Human capture"
    icon="◉"
    tag="MEDIAPIPE"
    class="capture-panel"
  >
    <MotionCaptureViewer
      :sample="state?.sample ?? null"
      :source="state?.source ?? 'demo'"
      :facing="state?.facing ?? 'user'"
      :caption="state?.captureCaption ?? 'Initializing studio…'"
      :fps="state?.captureFps ?? 30"
      @ready="emit('videoReady', $event)"
    />
    <div class="capture-settings">
      <StudioSelect
        id="camera-facing"
        label="Camera source"
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
          >◉ Enable camera</StudioButton
        ><StudioButton
          variant="subtle"
          :disabled="!state || state.recording"
          title="Return to the synthetic source"
          @click="emit('demo')"
          >Demo</StudioButton
        >
      </div>
      <p class="hint">
        Frame your whole body from 2–3 meters away. Keep your joints visible.
      </p>
    </div>
  </StudioPanel>
</template>
