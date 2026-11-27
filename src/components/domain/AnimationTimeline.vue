<!-- Projette un clip sur quatre pistes et transmet les commandes de transport sans gérer le temps. -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import StudioButton from "../core/StudioButton.vue";
import StudioRangeField from "../forms/StudioRangeField.vue";
import StudioSelect from "../selectors/StudioSelect.vue";
import type { StudioSnapshot } from "../../application/ports";
import { drawTimeline } from "../../infrastructure/canvas/timeline-tracks";
import { timecode } from "./timecode";
const props = defineProps<{ state: StudioSnapshot }>();
const emit = defineEmits<{
  rewind: [];
  play: [];
  loop: [];
  speed: [value: number];
  seek: [seconds: number];
}>();
const canvas = ref<HTMLCanvasElement | null>(null);
const speeds = [
  { value: 0.5, label: "0,5×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
];
let observer: ResizeObserver | undefined;
/** Actualise uniquement les pistes graphiques selon la projection applicative. */
function redraw() {
  if (canvas.value)
    drawTimeline(canvas.value, props.state.selectedClip, props.state.time);
}
watch(() => [props.state.time, props.state.selectedClip], redraw, {
  flush: "post",
});
onMounted(() => {
  if (!canvas.value) return;
  observer = new ResizeObserver(redraw);
  observer.observe(canvas.value);
  redraw();
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <section class="panel timeline-panel" aria-label="Timeline de l’animation">
    <div class="timeline-toolbar">
      <div>
        <h2>
          Timeline
          <span>{{
            state.recording
              ? "Enregistrement…"
              : (state.selectedClip?.name ?? "Aucun clip")
          }}</span>
        </h2>
        <small>Déplacez la tête de lecture pour explorer le clip</small>
      </div>
      <div class="transport">
        <StudioButton
          variant="icon"
          :disabled="state.recording || state.busy || !state.selectedClip"
          aria-label="Revenir au début"
          title="Revenir au début"
          @click="emit('rewind')"
          >Ⅰ◀</StudioButton
        >
        <StudioButton
          variant="primary"
          class="play-button"
          :disabled="state.recording || state.busy || !state.selectedClip"
          :aria-label="state.playing ? 'Mettre en pause' : 'Lire le clip'"
          @click="emit('play')"
          >{{ state.playing ? "Ⅱ" : "▶" }}</StudioButton
        >
        <StudioButton
          variant="icon"
          :selected="state.loop"
          :aria-pressed="state.loop"
          :disabled="state.recording || state.busy || !state.selectedClip"
          aria-label="Lecture en boucle"
          title="Lecture en boucle"
          @click="emit('loop')"
          >↻</StudioButton
        >
        <StudioSelect
          id="speed"
          label="Vitesse de lecture"
          compact
          :model-value="state.speed"
          :options="speeds"
          @update:model-value="emit('speed', Number($event))"
        />
        <span class="timecode"
          >{{ timecode(state.time) }} /
          {{ timecode(state.selectedClip?.duration ?? 0) }}</span
        >
      </div>
    </div>
    <div class="timeline-content">
      <div class="track-labels">
        <span>PISTES</span><span><i class="track-dot root"></i> Root</span
        ><span><i class="track-dot spine"></i> Colonne</span
        ><span><i class="track-dot arms"></i> Bras G / D</span
        ><span><i class="track-dot legs"></i> Jambes G / D</span>
      </div>
      <div class="tracks">
        <canvas ref="canvas" aria-hidden="true"></canvas
        ><StudioRangeField
          id="scrubber"
          label="Position de la tête de lecture en secondes"
          overlay
          :min="0"
          :max="state.selectedClip?.duration ?? 6"
          :step="0.001"
          :model-value="state.time"
          :disabled="state.recording || state.busy || !state.selectedClip"
          @update:model-value="emit('seek', $event)"
        />
      </div>
    </div>
  </section>
</template>
