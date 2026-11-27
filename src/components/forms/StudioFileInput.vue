<!-- Local file picker: accessible opening through StudioButton and reset after selection. -->
<script setup lang="ts">
import { ref } from "vue";
import StudioButton from "../core/StudioButton.vue";

const props = defineProps<{
  id: string;
  label: string;
  accept: string;
  disabled?: boolean;
}>();
const emit = defineEmits<{ selected: [file: File] }>();
const fileInput = ref<HTMLInputElement>();

/** Opens the native picker without reading or interpreting the file. */
function openFilePicker(): void {
  if (!props.disabled) fileInput.value?.click();
}

/** Emits the first selected file and allows the same file to be selected again. */
function handleSelection(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && !props.disabled) emit("selected", file);
  input.value = "";
}
</script>

<template>
  <div class="file-input-wrapper">
    <StudioButton
      class="file-button"
      :disabled="disabled"
      @click="openFilePicker"
      >{{ label }}</StudioButton
    >
    <input
      :id="id"
      ref="fileInput"
      type="file"
      :accept="accept"
      :disabled="disabled"
      hidden
      @change="handleSelection"
    />
  </div>
</template>
