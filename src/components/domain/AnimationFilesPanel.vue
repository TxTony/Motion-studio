<!-- Expose les échanges JSON existants ; aucun format GLTF d’animation n’est proposé. -->
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
        Sauvegardez les rotations et la timeline. Vos vidéos restent sur votre
        appareil.
      </p>
      <div class="button-row">
        <StudioButton
          variant="primary"
          :disabled="disabled || !canExport"
          @click="emit('export')"
          >⇩ Exporter le clip</StudioButton
        ><StudioFileInput
          id="json-import"
          label="Importer"
          accept=".json,application/json"
          :disabled="disabled"
          @selected="emit('import', $event)"
        />
      </div></div
  ></StudioPanel>
</template>
