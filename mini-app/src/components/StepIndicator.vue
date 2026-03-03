<template>
  <div class="step-indicator">
    <div
      v-for="s in total"
      :key="s"
      class="step-dot"
      :class="{ active: s === current, done: s < current }"
    ></div>
  </div>
</template>

<script>
export default {
  props: {
    current: { type: Number, required: true },
    total: { type: Number, required: true }
  }
};
</script>

<style scoped>
.step-indicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px 0;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--secondary-bg, #e5e5e5);
  transition: all 0.3s;
}

.step-dot.active {
  width: 28px;
  border-radius: 5px;
  background: var(--button-color, #ec4899);
}

.step-dot.done {
  background: var(--button-color, #ec4899);
  opacity: 0.5;
}
</style>
