<template>
  <div>
    <button class="back-btn" @click="$emit('back')">← Назад</button>
    <h2 class="section-title">Подтверждение</h2>

    <div class="summary-card">
      <div class="summary-row">
        <span class="summary-label">✂️ Услуга</span>
        <span class="summary-value">{{ booking.serviceName }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">👩‍🎨 Мастер</span>
        <span class="summary-value">{{ booking.employeeName }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">📅 Дата</span>
        <span class="summary-value">{{ formatDate(booking.date) }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">🕐 Время</span>
        <span class="summary-value">{{ booking.time }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">⏱ Длительность</span>
        <span class="summary-value">{{ formatDuration(booking.serviceDuration) }}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-row">
        <span class="summary-label" style="font-weight:700;font-size:16px">💰 Итого</span>
        <span class="summary-value" style="font-weight:700;font-size:20px">{{ booking.servicePrice }} ₽</span>
      </div>
    </div>

    <button class="btn" style="margin-top: 20px" @click="$emit('confirm')" :disabled="confirming">
      {{ confirming ? 'Оформление...' : '✅ Подтвердить запись' }}
    </button>
  </div>
</template>

<script>
export default {
  props: {
    booking: { type: Object, required: true },
    confirming: { type: Boolean, default: false }
  },
  emits: ['confirm', 'back'],
  setup() {
    function formatDate(dateStr) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ru-RU', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
    }

    function formatDuration(minutes) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}ч${m > 0 ? ` ${m}мин` : ''}` : `${m}мин`;
    }

    return { formatDate, formatDuration };
  }
};
</script>

<style scoped>
.summary-card {
  background: var(--secondary-bg, #f5f5f5);
  border-radius: 16px;
  padding: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.summary-label {
  color: var(--hint-color, #999);
  font-size: 14px;
}

.summary-value {
  font-weight: 600;
  font-size: 15px;
}

.summary-divider {
  height: 1px;
  background: var(--hint-color, #ddd);
  opacity: 0.3;
  margin: 8px 0;
}
</style>
