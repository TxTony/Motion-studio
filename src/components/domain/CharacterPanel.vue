<!-- Presents rig identity and forwards the selected GLB to the application boundary. -->
<script setup lang="ts">
import StudioPanel from "../core/StudioPanel.vue";
import StudioFileInput from "../forms/StudioFileInput.vue";
defineProps<{ name: string; kind: string; disabled: boolean }>();
const emit = defineEmits<{ import: [file: File] }>();
</script>
<template>
  <StudioPanel title="Character" tag="RIG"
    ><div class="inspector-body">
      <div class="character-card">
        <span class="avatar">♙</span>
        <div>
          <strong>{{ name }}</strong><small>{{
            kind.startsWith("Procedural rig")
              ? "procedural-default"
              : "GLB · compatible rig"
          }}</small>
        </div>
        <span class="green-text">●</span>
      </div>
      <StudioFileInput
        id="glb-import"
        label="＋ Import a GLB character"
        accept=".glb"
        :disabled="disabled"
        @selected="emit('import', $event)"
      />
      <p class="hint">
        A compatible rig is required.
        <a
          href="https://github.com/TxTony/Motion-studio#interchangeable-character"
          target="_blank"
          rel="noreferrer"
          >Joint contract ↗</a
        >
      </p>
    </div></StudioPanel
  >
</template>
