<!-- Encapsule Three.js, ses surimpressions et la propriété du montage/démontage des ressources GPU. -->
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
      "WebGL indisponible. Activez l’accélération graphique ou ouvrez un navigateur compatible.",
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
    <div class="scene-help">
      Glisser pour orbiter <span>·</span> Pincer pour zoomer
    </div>
    <span class="axis-mark"><b>Y</b><span>Z ◇ X</span></span>
  </div>
</template>
