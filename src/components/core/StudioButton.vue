<!-- Primitive d’action commune : variantes visuelles et événement natif sans décision métier. -->
<script setup lang="ts">
type ButtonVariant =
  "primary" | "subtle" | "icon" | "record" | "clip" | "new-clip";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    disabled?: boolean;
    selected?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { type: "button", variant: "subtle", disabled: false, selected: false },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();
const variantClasses: Record<ButtonVariant, string> = {
  primary: "primary",
  subtle: "subtle",
  icon: "icon-button",
  record: "record-button",
  clip: "clip-card",
  "new-clip": "new-clip",
};

/** Transmet l’intention d’action uniquement si le contrôle est disponible. */
function handleClick(event: MouseEvent): void {
  if (!props.disabled) emit("click", event);
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[variantClasses[variant], { selected }]"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
