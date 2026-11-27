<!-- Reusable text field: label, native constraints and a parent-controlled value. -->
<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  modelValue: string;
  disabled?: boolean;
  maxlength?: number;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

/** Emits raw text without applying business validation. */
function handleInput(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div>
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      type="text"
      :value="modelValue"
      :disabled="disabled"
      :maxlength="maxlength"
      @input="handleInput"
    />
  </div>
</template>
