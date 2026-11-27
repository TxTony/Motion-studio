<!-- Composes recording controls from reusable form components. -->
<script setup lang="ts">
import StudioPanel from "../core/StudioPanel.vue";
import StudioButton from "../core/StudioButton.vue";
import StudioTextField from "../forms/StudioTextField.vue";
import StudioCheckbox from "../forms/StudioCheckbox.vue";
import StudioSelect from "../selectors/StudioSelect.vue";
import type { StudioSnapshot } from "../../application/ports";
import type { StudioSettings } from "../../application/studio-state";
import { timecode } from "./timecode";
defineProps<{ state: StudioSnapshot }>();
const emit = defineEmits<{
  configure: [patch: Partial<StudioSettings>];
  record: [];
  stop: [];
}>();
const frequencies = [
  { value: 30, label: "30 frames / second" },
  { value: 15, label: "15 frames / second" },
];
</script>
<template>
  <StudioPanel title="Animation" tag="CLIP"
    ><div class="inspector-body">
      <StudioTextField
        id="clip-name"
        label="Capture name"
        :model-value="state.clipName"
        :disabled="state.recording || state.busy"
        :maxlength="80"
        @update:model-value="emit('configure', { clipName: $event })"
      />
      <div class="record-status">
        <i :class="{ recording: state.recording }"></i
        ><span>{{ state.recording ? "Recording…" : "Ready to record" }}</span
        ><time>{{ timecode(state.recordingTime) }}</time>
      </div>
      <div class="button-row">
        <StudioButton
          variant="record"
          :disabled="state.recording || state.busy || !state.ready"
          @click="emit('record')"
          >● Record</StudioButton
        ><StudioButton
          variant="icon"
          :disabled="!state.recording"
          aria-label="Stop recording"
          title="Stop recording"
          @click="emit('stop')"
          >■</StudioButton
        >
      </div>
      <StudioSelect
        id="record-fps"
        label="Maximum sampling rate"
        :model-value="state.fps"
        :options="frequencies"
        :disabled="state.recording || state.busy"
        @update:model-value="emit('configure', { fps: Number($event) })"
      />
      <StudioCheckbox
        id="capture-root"
        label="Capture 2D movement"
        :model-value="state.captureRoot"
        :disabled="state.recording || state.busy"
        @update:model-value="emit('configure', { captureRoot: $event })"
      /></div
  ></StudioPanel>
</template>
