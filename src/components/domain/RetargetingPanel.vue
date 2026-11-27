<!-- Presents smoothing and recentering; converts only the display value in milliseconds. -->
<script setup lang="ts">
import StudioPanel from "../core/StudioPanel.vue";
import StudioButton from "../core/StudioButton.vue";
import StudioRangeField from "../forms/StudioRangeField.vue";
defineProps<{ smoothing: number; disabled: boolean }>();
const emit = defineEmits<{ smoothing: [seconds: number]; calibrate: [] }>();
</script>
<template>
  <StudioPanel title="Retargeting"
    ><div class="inspector-body">
      <StudioRangeField
        id="smoothing"
        label="Smoothing"
        :model-value="smoothing * 1000"
        :min="0"
        :max="400"
        :step="10"
        unit="ms"
        :disabled="disabled"
        @update:model-value="emit('smoothing', $event / 1000)"
      />
      <div class="range-labels"><span>Responsive</span><span>Smooth</span></div>
      <StudioButton
        variant="subtle"
        class="full-width"
        @click="emit('calibrate')"
        >Recenter movement</StudioButton
      >
    </div></StudioPanel
  >
</template>
