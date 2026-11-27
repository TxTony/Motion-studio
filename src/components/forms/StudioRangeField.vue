<!-- Shared numeric slider: native bounds, units and an overlay mode for the timeline. -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: number;
    min: number;
    max: number;
    step?: number;
    disabled?: boolean;
    unit?: string;
    overlay?: boolean;
  }>(),
  { step: 1, disabled: false, unit: "", overlay: false },
);
const emit = defineEmits<{ "update:modelValue": [value: number] }>();

/** Converts the native slider value to a number for its owner. */
function handleInput(event: Event): void {
  emit("update:modelValue", Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <div :class="{ 'range-overlay': overlay }">
    <label v-if="!overlay" :for="id"
      >{{ label }}
      <output>{{ modelValue }}{{ unit ? ` ${unit}` : "" }}</output></label
    >
    <input
      :id="id"
      type="range"
      :class="{ 'timeline-scrubber': overlay }"
      :aria-label="label"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      @input="handleInput"
    />
  </div>
</template>
