<!-- Presents session clips and selection; the application retains library ownership. -->
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
    title="Animation library"
    tag="LOCAL SESSION"
    class="library-panel"
    ><template #title
      >Animation library <span>{{ clips.length }}</span></template
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
              clip.name.includes("Demo") ? " · demo" : ""
            }}</small
          ></span
        >
      </StudioButton>
      <StudioButton
        variant="new-clip"
        :disabled="disabled"
        @click="emit('create')"
        ><span><b>＋</b>New capture</span></StudioButton
      >
    </div></StudioPanel
  >
</template>
