<template>
  <div>
    <button class="back-btn" @click="$emit('back')">← Назад</button>
    <h2 class="section-title">Выберите дату</h2>

    <div v-if="loading" class="hint" style="text-align:center;padding:40px">
      Проверка расписания мастера...
    </div>

    <div v-else>
      <div class="dates-grid">
        <div
          v-for="d in dates"
          :key="d.date"
          class="date-card"
          :class="{ disabled: !d.available, selected: selected === d.date, vacation: d.vacation }"
          @click="d.available && selectDate(d.date)"
        >
          <div class="day-name">{{ d.dayName }}</div>
          <div class="day-number">{{ d.day }}</div>
          <div class="month-name">{{ d.month }}</div>
        </div>
      </div>

      <p v-if="dates.every(d => !d.available)" class="hint" style="text-align:center;padding:20px">
        К сожалению, у мастера нет доступных дат на ближайшие 14 дней.
      </p>

      <button
        v-if="selected"
        class="btn"
        style="margin-top: 20px"
        @click="$emit('select', selected)"
      >
        Продолжить
      </button>
    </div>
  </div>
</template>

<script>
import { ref, inject, onMounted } from 'vue';

export default {
  props: {
    employeeId: { type: Number, required: true },
    serviceId: { type: Number, required: true }
  },
  emits: ['select', 'back'],
  setup(props) {
    const apiBase = inject('apiBase');
    const dates = ref([]);
    const selected = ref(null);
    const loading = ref(true);

    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

    onMounted(async () => {
      const today = new Date();
      const result = [];

      for (let i = 1; i <= 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        result.push({
          date: dateStr,
          day: d.getDate(),
          dayName: dayNames[dayOfWeek],
          month: monthNames[d.getMonth()],
          dayOfWeek,
          available: true,
          vacation: false
        });
      }

      // Check availability for each date by fetching slots
      // Do it in parallel for speed
      try {
        const checks = result.map(d =>
          fetch(`${apiBase}/booking/slots?employeeId=${props.employeeId}&date=${d.date}&serviceId=${props.serviceId}`)
            .then(res => res.json())
            .then(slots => ({ date: d.date, hasSlots: Array.isArray(slots) && slots.length > 0 }))
            .catch(() => ({ date: d.date, hasSlots: true })) // on error, assume available
        );

        const results = await Promise.all(checks);
        for (const check of results) {
          const dateItem = result.find(d => d.date === check.date);
          if (dateItem) {
            dateItem.available = check.hasSlots;
          }
        }
      } catch (err) {
        console.error('Failed to check date availability:', err);
      }

      dates.value = result;
      loading.value = false;
    });

    function selectDate(date) {
      selected.value = date;
    }

    return { dates, selected, loading, selectDate };
  }
};
</script>

<style scoped>
.dates-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.date-card {
  text-align: center;
  padding: 12px 8px;
  border-radius: 12px;
  background: var(--secondary-bg, #f5f5f5);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.date-card:active {
  transform: scale(0.95);
}

.date-card.disabled {
  opacity: 0.3;
  cursor: default;
}

.date-card.disabled:active {
  transform: none;
}

.date-card.selected {
  border-color: var(--button-color, #ec4899);
  background: rgba(236, 72, 153, 0.1);
}

.day-name {
  font-size: 12px;
  color: var(--hint-color, #999);
  margin-bottom: 4px;
}

.day-number {
  font-size: 22px;
  font-weight: 700;
}

.month-name {
  font-size: 12px;
  color: var(--hint-color, #999);
  margin-top: 2px;
}
</style>
