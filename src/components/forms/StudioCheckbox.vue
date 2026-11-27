<!-- Reusable boolean option: native control and label without session knowledge. -->
<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  modelValue: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

/** Emits the checked state while the parent retains ownership of the data. */
function handleChange(event: Event): void {
  emit("update:modelValue", (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <label :for="id" class="check-label">
    <input
      :id="id"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />
    {{ label }}
  </label>
</template>
