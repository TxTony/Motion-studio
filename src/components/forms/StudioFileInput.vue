<!-- Sélecteur de fichier local : ouverture accessible via StudioButton et remise à zéro après choix. -->
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

/** Ouvre le dialogue natif sans lire ni interpréter le fichier. */
function openFilePicker(): void {
  if (!props.disabled) fileInput.value?.click();
}

/** Transmet le premier fichier choisi et permet de choisir à nouveau le même fichier. */
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
