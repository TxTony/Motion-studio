<!-- Encapsulates Three.js, its overlays and ownership of GPU resource setup and teardown. -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { CharacterRenderer } from "../../infrastructure/three/CharacterRenderer";
const props = defineProps<{ name: string; kind: string }>();
const emit = defineEmits<{
  ready: [renderer: CharacterRenderer];
  error: [message: string];
}>();
const surface = ref<HTMLElement | null>(null);
let renderer: CharacterRenderer | undefined;
onMounted(() => {
  if (!surface.value) return;
  try {
    renderer = new CharacterRenderer(surface.value);
    emit("ready", renderer);
  } catch {
    emit(
      "error",
      "WebGL is unavailable. Enable hardware acceleration or open a compatible browser.",
    );
  }
});
onBeforeUnmount(() => renderer?.dispose());
</script>
<template>
  <div id="renderer" ref="surface">
    <div class="scene-meta">
      <span class="scene-name">{{ props.name.toUpperCase() }}</span><span>{{
        kind
      }}</span>
    </div>
    <div class="scene-help">Drag to orbit <span>·</span> Pinch to zoom</div>
    <span class="axis-mark"><b>Y</b><span>Z ◇ X</span></span>
  </div>
</template>
