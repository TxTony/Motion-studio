<!-- Presents video and overlaid landmarks; owns the DOM surfaces and their resizing. -->
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
/** Projects landmarks into the same contained rectangle as the active video. */
function redraw() {
  if (!overlay.value) return;
  const nativeVideo =
    props.source === "camera" &&
    video.value?.videoWidth &&
    video.value.videoHeight;
  drawSkeleton(overlay.value, props.sample, {
    width: nativeVideo ? video.value!.videoWidth : 640,
    height: nativeVideo ? video.value!.videoHeight : 480,
  });
}
watch(() => [props.sample, props.source], redraw, { flush: "post" });
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
    <video
      ref="video"
      playsinline
      muted
      aria-label="Camera preview"
      @loadedmetadata="redraw"
      @resize="redraw"
    ></video
    ><canvas ref="overlay" aria-label="Detected joints"></canvas>
    <div class="viewport-badge">
      <i></i
      ><span>{{ source === "demo" ? "DEMONSTRATION" : "CAMERA ACTIVE" }}</span>
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
