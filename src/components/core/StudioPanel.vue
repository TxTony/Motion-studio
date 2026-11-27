<!-- Conteneur de présentation commun : titre, repère et emplacements de composition du studio. -->
<script setup lang="ts">
defineProps<{ title: string; tag?: string; icon?: string }>();
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2>
        <span v-if="icon" class="panel-icon" aria-hidden="true">{{
          icon
        }}</span><slot name="title">{{ title }}</slot>
      </h2>
      <span v-if="tag" class="tag">{{ tag }}</span>
      <slot name="actions" />
    </div>
    <slot />
  </section>
</template>
