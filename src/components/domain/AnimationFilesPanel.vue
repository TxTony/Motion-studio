<!-- Presents the existing JSON exchange actions without offering GLTF animation export. -->
<script setup lang="ts">
import StudioPanel from "../core/StudioPanel.vue";
import StudioButton from "../core/StudioButton.vue";
import StudioFileInput from "../forms/StudioFileInput.vue";
defineProps<{ disabled: boolean; canExport: boolean }>();
const emit = defineEmits<{ export: []; import: [file: File] }>();
</script>
<template>
  <StudioPanel title="Export & import" tag="JSON v1" class="export-panel"
    ><div class="inspector-body">
      <p class="hint">
        Save rotations and the timeline. Your videos stay on your device.
      </p>
      <div class="button-row">
        <StudioButton
          variant="primary"
          :disabled="disabled || !canExport"
          @click="emit('export')"
          >⇩ Export clip</StudioButton
        ><StudioFileInput
          id="json-import"
          label="Import"
          accept=".json,application/json"
          :disabled="disabled"
          @selected="emit('import', $event)"
        />
      </div></div
  ></StudioPanel>
</template>
