<!-- Présente les clips de session et la sélection ; la bibliothèque reste propriété de l’application. -->
<script setup lang="ts">
import StudioPanel from "../core/StudioPanel.vue";
import StudioButton from "../core/StudioButton.vue";
import type { AnimationClip } from "../../domain/studio";
defineProps<{
  clips: AnimationClip[];
  selected: AnimationClip | null;
  disabled: boolean;
}>();
const emit = defineEmits<{ select: [clip: AnimationClip]; create: [] }>();
</script>
<template>
  <StudioPanel
    id="library"
    title="Bibliothèque d’animations"
    tag="SESSION LOCALE"
    class="library-panel"
    ><template #title
      >Bibliothèque d’animations <span>{{ clips.length }}</span></template
    >
    <div class="clips">
      <StudioButton
        v-for="(clip, index) in clips"
        :key="index"
        variant="clip"
        :selected="selected === clip"
        :aria-pressed="selected === clip"
        :disabled="disabled"
        @click="emit('select', clip)"
      >
        <span class="clip-symbol">♙</span
        ><span
          ><strong>{{ clip.name }}</strong
          ><small
            >{{ clip.duration.toFixed(2) }} s · {{ clip.frames.length }} poses{{
              clip.name.includes("Démo") ? " · démo" : ""
            }}</small
          ></span
        >
      </StudioButton>
      <StudioButton
        variant="new-clip"
        :disabled="disabled"
        @click="emit('create')"
        ><span><b>＋</b>Nouvelle capture</span></StudioButton
      >
    </div></StudioPanel
  >
</template>
