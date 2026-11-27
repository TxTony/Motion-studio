<!-- Sélecteur d’options commun : libellé accessible et émission de la valeur native sous forme texte. -->
<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  modelValue: string | number;
  options: readonly { label: string; value: string | number }[];
  disabled?: boolean;
  compact?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

/** Remonte la valeur choisie sans décider de sa conversion métier. */
function handleChange(event: Event): void {
  emit("update:modelValue", (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <div>
    <label v-if="!compact" :for="id">{{ label }}</label>
    <select
      :id="id"
      :aria-label="label"
      :value="modelValue"
      :disabled="disabled"
      @change="handleChange"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
