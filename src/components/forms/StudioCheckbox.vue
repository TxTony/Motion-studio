<!-- Option booléenne réutilisable : contrôle natif et libellé sans connaissance de la session. -->
<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  modelValue: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

/** Remonte l’état coché pour que le parent reste propriétaire de la donnée. */
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
