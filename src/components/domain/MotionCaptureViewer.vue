<!-- Présente vidéo et repères superposés ; possède les surfaces DOM et leur redimensionnement. -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import type { PoseSample } from "../../domain/studio";
import { drawSkeleton } from "../../infrastructure/canvas/skeleton-overlay";
const props = defineProps<{
  sample: PoseSample | null;
  source: "demo" | "camera";
  facing: "user" | "environment";
  caption: string;
  fps: number;
}>();
const emit = defineEmits<{ ready: [video: HTMLVideoElement] }>();
const video = ref<HTMLVideoElement | null>(null),
  overlay = ref<HTMLCanvasElement | null>(null);
let observer: ResizeObserver | undefined;
/** Reprojette les points dans le même rectangle contain que la vidéo active. */
function redraw() {
  if (!overlay.value) return;
  const ratio =
    props.source === "camera" && video.value?.videoWidth
      ? video.value.videoWidth / video.value.videoHeight
      : 4 / 3;
  drawSkeleton(overlay.value, props.sample, ratio);
}
watch(() => props.sample, redraw, { flush: "post" });
onMounted(() => {
  if (!video.value || !overlay.value) return;
  emit("ready", video.value);
  observer = new ResizeObserver(redraw);
  observer.observe(overlay.value);
  redraw();
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div
    class="capture-viewport"
    :class="{ mirrored: source === 'camera' && facing === 'user' }"
  >
    <video ref="video" playsinline muted></video
    ><canvas ref="overlay" aria-label="Articulations détectées"></canvas>
    <div class="viewport-badge">
      <i></i
      ><span>{{ source === "demo" ? "DÉMONSTRATION" : "CAMÉRA ACTIVE" }}</span>
    </div>
    <div class="capture-caption">
      <span>{{ caption }}</span><span>{{ fps }} FPS</span>
    </div>
    <div class="frame-corner tl"></div>
    <div class="frame-corner tr"></div>
    <div class="frame-corner bl"></div>
    <div class="frame-corner br"></div>
  </div>
</template>
