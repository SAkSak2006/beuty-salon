<template>
  <div>
    <button class="back-btn" @click="$emit('back')">← Назад</button>
    <h2 class="section-title">Выберите время</h2>

    <div v-if="loading" class="hint" style="text-align:center;padding:40px">
      Загрузка свободных слотов...
    </div>

    <div v-else-if="slots.length === 0" class="hint" style="text-align:center;padding:40px">
      На эту дату нет свободных слотов. Попробуйте выбрать другой день.
    </div>

    <div v-else class="time-grid">
      <div
        v-for="slot in slots"
        :key="slot"
        class="time-chip"
        :class="{ selected: selected === slot }"
        @click="selectTime(slot)"
      >
        {{ slot }}
      </div>
    </div>

    <button
      v-if="selected"
      class="btn"
      style="margin-top: 20px"
      @click="$emit('select', selected)"
    >
      Продолжить
    </button>
  </div>
</template>

<script>
import { ref, inject, onMounted } from 'vue';

export default {
  props: {
    employeeId: { type: Number, required: true },
    serviceId: { type: Number, required: true },
    date: { type: String, required: true }
  },
  emits: ['select', 'back'],
  setup(props) {
    const apiBase = inject('apiBase');
    const slots = ref([]);
    const selected = ref(null);
    const loading = ref(true);

    onMounted(async () => {
      try {
        const res = await fetch(
          `${apiBase}/booking/slots?employeeId=${props.employeeId}&date=${props.date}&serviceId=${props.serviceId}`
        );
        slots.value = await res.json();
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        loading.value = false;
      }
    });

    function selectTime(time) {
      selected.value = time;
    }

    return { slots, selected, loading, selectTime };
  }
};
</script>

<style scoped>
.time-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.time-chip {
  text-align: center;
  padding: 14px;
  border-radius: 10px;
  background: var(--secondary-bg, #f5f5f5);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.time-chip:active {
  transform: scale(0.95);
}

.time-chip.selected {
  border-color: var(--button-color, #ec4899);
  background: rgba(236, 72, 153, 0.1);
}
</style>
