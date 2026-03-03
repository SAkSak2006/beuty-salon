<template>
  <div>
    <button class="back-btn" @click="$emit('back')">← Назад</button>
    <h2 class="section-title">Выберите мастера</h2>

    <div v-if="loading" class="hint" style="text-align:center;padding:40px">
      Загрузка мастеров...
    </div>

    <div v-else>
      <div v-if="masters.length === 0" class="hint" style="text-align:center;padding:40px">
        Нет доступных мастеров для этой услуги
      </div>

      <div
        v-for="master in masters"
        :key="master.id"
        class="card"
        @click="$emit('select', master)"
      >
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--button-color, #ec4899);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:18px">
            {{ master.name.charAt(0) }}
          </div>
          <div>
            <div style="font-weight:600">{{ master.name }}</div>
            <div class="hint">{{ master.position }}</div>
            <div class="hint" v-if="master.skillLevel">Уровень: {{ skillLabels[master.skillLevel] || master.skillLevel }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, inject, onMounted } from 'vue';

export default {
  props: {
    serviceId: { type: Number, required: true }
  },
  emits: ['select', 'back'],
  setup(props) {
    const apiBase = inject('apiBase');
    const masters = ref([]);
    const loading = ref(true);
    const skillLabels = { junior: 'Начинающий', middle: 'Опытный', senior: 'Эксперт' };

    onMounted(async () => {
      try {
        const res = await fetch(`${apiBase}/booking/masters?serviceId=${props.serviceId}`);
        masters.value = await res.json();
      } catch (err) {
        console.error('Failed to load masters:', err);
      } finally {
        loading.value = false;
      }
    });

    return { masters, loading, skillLabels };
  }
};
</script>
