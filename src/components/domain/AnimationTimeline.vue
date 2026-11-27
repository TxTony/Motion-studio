<!-- Projects a clip onto four tracks and emits transport commands without managing time. -->
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
  { value: 0.5, label: "0.5×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
];
let observer: ResizeObserver | undefined;
/** Updates only the visual tracks from the application snapshot. */
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
  <section class="panel timeline-panel" aria-label="Animation timeline">
    <div class="timeline-toolbar">
      <div>
        <h2>
          Timeline
          <span>{{
            state.recording
              ? "Recording…"
              : (state.selectedClip?.name ?? "No clip")
          }}</span>
        </h2>
        <small>Move the playhead to explore the clip</small>
      </div>
      <div class="transport">
        <StudioButton
          variant="icon"
          :disabled="state.recording || state.busy || !state.selectedClip"
          aria-label="Return to start"
          title="Return to start"
          @click="emit('rewind')"
          >Ⅰ◀</StudioButton
        >
        <StudioButton
          variant="primary"
          class="play-button"
          :disabled="state.recording || state.busy || !state.selectedClip"
          :aria-label="state.playing ? 'Pause playback' : 'Play clip'"
          @click="emit('play')"
          >{{ state.playing ? "Ⅱ" : "▶" }}</StudioButton
        >
        <StudioButton
          variant="icon"
          :selected="state.loop"
          :aria-pressed="state.loop"
          :disabled="state.recording || state.busy || !state.selectedClip"
          aria-label="Loop playback"
          title="Loop playback"
          @click="emit('loop')"
          >↻</StudioButton
        >
        <StudioSelect
          id="speed"
          label="Playback speed"
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
        <span>TRACKS</span><span><i class="track-dot root"></i> Root</span
        ><span><i class="track-dot spine"></i> Spine</span
        ><span><i class="track-dot arms"></i> Arms L / R</span
        ><span><i class="track-dot legs"></i> Legs L / R</span>
      </div>
      <div class="tracks">
        <canvas ref="canvas" aria-hidden="true"></canvas
        ><StudioRangeField
          id="scrubber"
          label="Playhead position in seconds"
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
