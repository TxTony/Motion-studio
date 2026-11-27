<!-- Présente l’identité du rig et transmet le GLB sélectionné à la frontière applicative. -->
<script setup lang="ts">
import StudioPanel from "../core/StudioPanel.vue";
import StudioFileInput from "../forms/StudioFileInput.vue";
defineProps<{ name: string; kind: string; disabled: boolean }>();
const emit = defineEmits<{ import: [file: File] }>();
</script>
<template>
  <StudioPanel title="Personnage" tag="RIG"
    ><div class="inspector-body">
      <div class="character-card">
        <span class="avatar">♙</span>
        <div>
          <strong>{{ name }}</strong><small>{{
            kind.startsWith("Rig procédural")
              ? "goblin-procedural"
              : "GLB · rig compatible"
          }}</small>
        </div>
        <span class="green-text">●</span>
      </div>
      <StudioFileInput
        id="glb-import"
        label="＋ Importer un personnage GLB"
        accept=".glb"
        :disabled="disabled"
        @selected="emit('import', $event)"
      />
      <p class="hint">
        Rig compatible requis.
        <a
          href="https://github.com/TxTony/Motion-studio#personnage-interchangeable"
          target="_blank"
          rel="noreferrer"
          >Contrat des articulations ↗</a
        >
      </p>
    </div></StudioPanel
  >
</template>
